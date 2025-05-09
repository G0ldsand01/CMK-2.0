import { ordersTable } from '@/db/schema';
import db from '@/lib/db';
import { getUser } from '@/lib/user';
import { eq } from 'drizzle-orm';

export async function POST(context) {
	const user = await getUser(context.request);
	if (!user || !user.isAdmin()) {
		return new Response('Unauthorized', { status: 401 });
	}

	const orderId = context.params.id;
	const order = await db.query.ordersTable.findFirst({
		where: eq(ordersTable.id, orderId),
	});

	if (!order) {
		return new Response('Order not found', { status: 404 });
	}

	if (order.status === 'refunded') {
		return new Response('Cannot cancel a refunded order', { status: 400 });
	}

	await db
		.update(ordersTable)
		.set({ status: 'cancelled' })
		.where(eq(ordersTable.id, orderId));

	return new Response(JSON.stringify({ success: true }), {
		status: 200,
		headers: { 'Content-Type': 'application/json' },
	});
}
