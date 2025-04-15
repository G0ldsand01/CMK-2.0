import { STRIPE_WEBHOOK_SECRET } from 'astro:env/server';
import { ordersTable } from '@/db/schema';
import db from '@/lib/db';
import { log, logError } from '@/lib/log';
import { stripe } from '@/lib/stripe';
import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import type Stripe from 'stripe';

export const POST: APIRoute = async ({ request }) => {
	log('Stripe webhook received');
	const endpointSecret = STRIPE_WEBHOOK_SECRET;

	const sig = request.headers.get('stripe-signature');

	if (!sig) {
		logError('No Stripe signature found in request headers');
		return new Response(JSON.stringify({ error: 'No signature provided' }), {
			status: 400,
			headers: {
				'Content-Type': 'application/json',
			},
		});
	}

	let event: Stripe.Event;
	const rawBody = await request.text();

	try {
		event = stripe.webhooks.constructEvent(rawBody, sig, endpointSecret);
		log('Webhook signature verified successfully');
	} catch (err) {
		logError('Error verifying webhook signature:', err);
		return new Response(JSON.stringify({ error: (err as Error).message }), {
			status: 400,
			headers: {
				'Content-Type': 'application/json',
			},
		});
	}

	log(
		'Processing webhook event:',
		event.type,
		'Event data:',
		event.data.object,
	);

	try {
		switch (event.type) {
			case 'checkout.session.completed': {
				const session = event.data.object as Stripe.Checkout.Session;
				log(
					'Processing checkout.session.completed',
					'Session ID:',
					session.id,
					'Customer email:',
					session.customer_email,
				);

				if (!session.id || !session.customer_email) {
					logError(
						'Missing session id or customer email',
						'Session data:',
						session,
					);
					break;
				}

				const result = await db
					.update(ordersTable)
					.set({ status: 'paid' })
					.where(eq(ordersTable.stripeSessionId, session.id));
				log(
					'Updated order status to paid for session:',
					session.id,
					'Update result:',
					result,
				);
				break;
			}

			case 'payment_intent.succeeded': {
				const paymentIntent = event.data.object as Stripe.PaymentIntent;
				log(
					'Processing payment_intent.succeeded',
					'Payment Intent ID:',
					paymentIntent.id,
					'Metadata:',
					paymentIntent.metadata,
				);

				if (!paymentIntent.metadata?.sessionId) {
					logError(
						'Missing session id in payment intent metadata',
						'Payment Intent data:',
						paymentIntent,
					);
					break;
				}

				const result = await db
					.update(ordersTable)
					.set({ status: 'paid' })
					.where(
						eq(ordersTable.stripeSessionId, paymentIntent.metadata.sessionId),
					);
				log(
					'Updated order status to paid for session:',
					paymentIntent.metadata.sessionId,
					'Update result:',
					result,
				);
				break;
			}

			case 'payment_intent.payment_failed': {
				const paymentIntent = event.data.object as Stripe.PaymentIntent;
				log(
					'Processing payment_intent.payment_failed',
					'Payment Intent ID:',
					paymentIntent.id,
					'Metadata:',
					paymentIntent.metadata,
				);

				if (!paymentIntent.metadata?.sessionId) {
					logError(
						'Missing session id in payment intent metadata',
						'Payment Intent data:',
						paymentIntent,
					);
					break;
				}

				const result = await db
					.update(ordersTable)
					.set({ status: 'payment_failed' })
					.where(
						eq(ordersTable.stripeSessionId, paymentIntent.metadata.sessionId),
					);
				log(
					'Updated order status to payment_failed for session:',
					paymentIntent.metadata.sessionId,
					'Update result:',
					result,
				);
				break;
			}

			case 'checkout.session.expired': {
				const session = event.data.object as Stripe.Checkout.Session;
				log('Processing checkout.session.expired', 'Session ID:', session.id);

				if (!session.id) {
					logError('Missing session id', 'Session data:', session);
					break;
				}

				const result = await db
					.update(ordersTable)
					.set({ status: 'expired' })
					.where(eq(ordersTable.stripeSessionId, session.id));
				log(
					'Updated order status to expired for session:',
					session.id,
					'Update result:',
					result,
				);
				break;
			}

			case 'charge.refunded': {
				const charge = event.data.object as Stripe.Charge;
				log(
					'Processing charge.refunded',
					'Charge ID:',
					charge.id,
					'Payment Intent:',
					charge.payment_intent,
				);

				if (!charge.payment_intent) {
					logError('Missing payment intent in charge', 'Charge data:', charge);
					break;
				}

				const paymentIntent = await stripe.paymentIntents.retrieve(
					charge.payment_intent as string,
				);
				log(
					'Retrieved payment intent:',
					paymentIntent.id,
					'Metadata:',
					paymentIntent.metadata,
				);

				if (!paymentIntent.metadata?.sessionId) {
					logError(
						'Missing session id in payment intent metadata',
						'Payment Intent data:',
						paymentIntent,
					);
					break;
				}

				const result = await db
					.update(ordersTable)
					.set({ status: 'refunded' })
					.where(
						eq(ordersTable.stripeSessionId, paymentIntent.metadata.sessionId),
					);
				log(
					'Updated order status to refunded for session:',
					paymentIntent.metadata.sessionId,
					'Update result:',
					result,
				);
				break;
			}

			default:
				log(
					`Unhandled event type ${event.type}`,
					'Event data:',
					event.data.object,
				);
		}

		return new Response(JSON.stringify({ received: true }), {
			status: 200,
			headers: {
				'Content-Type': 'application/json',
			},
		});
	} catch (error) {
		logError('Error processing webhook:', error);
		return new Response(JSON.stringify({ error: 'Internal server error' }), {
			status: 500,
			headers: {
				'Content-Type': 'application/json',
			},
		});
	}
};
