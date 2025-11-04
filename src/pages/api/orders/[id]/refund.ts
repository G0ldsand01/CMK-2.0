import { eq } from 'drizzle-orm';
import { ordersTable } from '@/db/schema';
import db from '@/lib/db';
import { stripe } from '@/lib/stripe'; // Assure-toi d'avoir une instance Stripe ici
import { getCurrentUser } from '@/lib/auth-server';

export async function POST(context: {
	request: Request;
	params: { id: string };
}): Promise<Response> {
	const user = await getCurrentUser(context.request);
	if (!user || user.role !== 'admin') {
		return new Response('Unauthorized', { status: 401 });
	}

	const orderId = context.params.id;
	const order = await db.query.ordersTable.findFirst({
		where: eq(ordersTable.id, Number(orderId)),
	});

	if (!order || !order.stripeSessionId) {
		return new Response('Order not found or missing paymentIntent', {
			status: 404,
		});
	}

	try {
		const refund = await stripe.refunds.create({
			payment_intent: order.stripeSessionId,
		});

		await db
			.update(ordersTable)
			.set({ status: 'refunded' })
			.where(eq(ordersTable.id, Number(orderId)));

		return new Response(JSON.stringify({ success: true, refund }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		});
	} catch (err) {
		return new Response(
			JSON.stringify({
				error: err instanceof Error ? err.message : 'Unknown error',
			}),
			{
				status: 500,
				headers: { 'Content-Type': 'application/json' },
			},
		);
	}
}
