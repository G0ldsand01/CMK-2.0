import { eq } from 'drizzle-orm';
import { ordersTable } from '@/db/schema';
import { getCurrentUser } from '@/lib/auth-server';
import db from '@/lib/db';
import { stripe } from '@/lib/stripe';

export async function POST(context: {
	request: Request;
	params: { id: string };
}): Promise<Response> {
	const user = await getCurrentUser(context.request);
	if (!user || user.role !== 'admin') {
		return new Response(JSON.stringify({ error: 'Unauthorized' }), {
			status: 401,
			headers: { 'Content-Type': 'application/json' },
		});
	}

	const orderId = context.params.id;
	const order = await db.query.ordersTable.findFirst({
		where: eq(ordersTable.id, Number(orderId)),
	});

	if (!order || !order.stripeSessionId) {
		return new Response(
			JSON.stringify({ error: 'Order not found or missing Stripe session ID' }),
			{
				status: 404,
				headers: { 'Content-Type': 'application/json' },
			},
		);
	}

	// Check if already refunded
	if (order.status === 'refunded') {
		return new Response(
			JSON.stringify({ error: 'Order has already been refunded' }),
			{
				status: 400,
				headers: { 'Content-Type': 'application/json' },
			},
		);
	}

	try {
		let paymentIntentId: string | null = null;

		// Try to retrieve the Stripe checkout session first
		try {
			const session = await stripe.checkout.sessions.retrieve(
				order.stripeSessionId,
				{
					expand: ['payment_intent'],
				},
			);

			// Get the payment intent ID from the session
			paymentIntentId =
				typeof session.payment_intent === 'string'
					? session.payment_intent
					: session.payment_intent?.id || null;
		} catch (sessionError: unknown) {
			// If session doesn't exist (expired or invalid), try to find payment intent via payment intents
			const errorMessage =
				sessionError instanceof Error ? sessionError.message : 'Unknown error';
			console.warn(
				'Session retrieval failed, trying alternative method:',
				errorMessage,
			);

			// Try to find payment intents by searching for ones with the session ID or order ID in metadata
			try {
				// First, try to find by order ID in metadata (more reliable)
				const paymentIntentsByOrderId = await stripe.paymentIntents.search({
					query: `metadata['orderId']:'${orderId}'`,
					limit: 10,
				});

				if (paymentIntentsByOrderId.data.length > 0) {
					// Find the most recent one that succeeded
					const successfulPaymentIntent = paymentIntentsByOrderId.data.find(
						(pi) => pi.status === 'succeeded',
					);
					if (successfulPaymentIntent) {
						paymentIntentId = successfulPaymentIntent.id;
					} else if (paymentIntentsByOrderId.data.length > 0) {
						// Use the first one if no succeeded found
						paymentIntentId = paymentIntentsByOrderId.data[0].id;
					}
				}

				// If not found by order ID, try by session ID
				if (!paymentIntentId) {
					const paymentIntentsBySessionId = await stripe.paymentIntents.search({
						query: `metadata['sessionId']:'${order.stripeSessionId}'`,
						limit: 10,
					});

					if (paymentIntentsBySessionId.data.length > 0) {
						const successfulPaymentIntent = paymentIntentsBySessionId.data.find(
							(pi) => pi.status === 'succeeded',
						);
						if (successfulPaymentIntent) {
							paymentIntentId = successfulPaymentIntent.id;
						} else if (paymentIntentsBySessionId.data.length > 0) {
							paymentIntentId = paymentIntentsBySessionId.data[0].id;
						}
					}
				}

				// Fallback: try listing payment intents (less efficient but more comprehensive)
				if (!paymentIntentId) {
					const paymentIntents = await stripe.paymentIntents.list({
						limit: 100,
					});

					// Find payment intent that has this session ID in metadata
					const matchingPaymentIntent = paymentIntents.data.find(
						(pi) => pi.metadata?.sessionId === order.stripeSessionId,
					);

					if (matchingPaymentIntent) {
						paymentIntentId = matchingPaymentIntent.id;
					} else {
						// If not found by metadata, try to find by order ID in metadata
						const orderIdMatch = paymentIntents.data.find(
							(pi) => pi.metadata?.orderId === orderId.toString(),
						);
						if (orderIdMatch) {
							paymentIntentId = orderIdMatch.id;
						}
					}
				}
			} catch (piError) {
				console.error(
					'Failed to find payment intent via search/list:',
					piError,
				);
			}
		}

		if (!paymentIntentId) {
			return new Response(
				JSON.stringify({
					error:
						'Unable to find payment intent for this order. The Stripe session may have expired. Please contact support for manual refund processing.',
					details:
						'Stripe checkout sessions expire after 30 minutes. For orders older than this, please process refunds directly in the Stripe dashboard.',
				}),
				{
					status: 404,
					headers: { 'Content-Type': 'application/json' },
				},
			);
		}

		// Verify the payment intent exists and is refundable
		try {
			const paymentIntent =
				await stripe.paymentIntents.retrieve(paymentIntentId);

			// Check if already refunded
			if (
				paymentIntent.status === 'canceled' ||
				paymentIntent.status === 'requires_capture'
			) {
				return new Response(
					JSON.stringify({
						error:
							'This payment cannot be refunded. Payment status: ' +
							paymentIntent.status,
					}),
					{
						status: 400,
						headers: { 'Content-Type': 'application/json' },
					},
				);
			}
		} catch (piError: unknown) {
			const errorMessage =
				piError instanceof Error ? piError.message : 'Unknown error';
			return new Response(
				JSON.stringify({
					error: 'Payment intent not found or invalid: ' + errorMessage,
				}),
				{
					status: 404,
					headers: { 'Content-Type': 'application/json' },
				},
			);
		}

		// Create the refund
		const refund = await stripe.refunds.create({
			payment_intent: paymentIntentId,
		});

		// Update order status in database
		await db
			.update(ordersTable)
			.set({ status: 'refunded' })
			.where(eq(ordersTable.id, Number(orderId)));

		return new Response(
			JSON.stringify({
				success: true,
				refund: {
					id: refund.id,
					amount: refund.amount / 100, // Convert from cents to dollars
					status: refund.status,
				},
				message: 'Refund processed successfully',
			}),
			{
				status: 200,
				headers: { 'Content-Type': 'application/json' },
			},
		);
	} catch (err: unknown) {
		console.error('Refund error:', err);

		// Provide more helpful error messages
		let errorMessage = 'Unknown error occurred';
		let errorType = 'Unknown error type';

		if (err && typeof err === 'object' && 'type' in err) {
			errorType = String(err.type);
			if (err.type === 'StripeInvalidRequestError') {
				const stripeError = err as { message?: string; type: string };
				if (stripeError.message?.includes('No such checkout.session')) {
					errorMessage =
						'The Stripe session for this order has expired or is invalid. Please process the refund manually in the Stripe dashboard.';
				} else {
					errorMessage = stripeError.message || 'Stripe API error';
				}
			}
		} else if (err instanceof Error) {
			errorMessage = err.message;
		}

		return new Response(
			JSON.stringify({
				error: errorMessage,
				details: errorType,
			}),
			{
				status: 500,
				headers: { 'Content-Type': 'application/json' },
			},
		);
	}
}
