import { eq } from 'drizzle-orm';
import { ordersTable } from '@/db/schema';
import db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth-server';

export async function POST(context: {
	request: Request;
	params: { id: string };
}): Promise<Response> {
	const user = await getCurrentUser(context.request as Request);
	if (!user || user.role !== 'admin') {
		return new Response('Unauthorized', { status: 401 });
	}

	const orderId = context.params.id;
	const order = await db.query.ordersTable.findFirst({
		where: eq(ordersTable.id, Number(orderId)),
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
		.where(eq(ordersTable.id, Number(orderId)));

	return new Response(JSON.stringify({ success: true }), {
		status: 200,
		headers: { 'Content-Type': 'application/json' },
	});
}
