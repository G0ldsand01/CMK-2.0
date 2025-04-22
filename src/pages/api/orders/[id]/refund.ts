import { stripe } from '@/lib/stripe'; // Assure-toi d'avoir une instance Stripe ici
import db from '@/lib/db';
import { ordersTable } from '@/db/schema';
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

  if (!order || !order.paymentIntentId) {
    return new Response('Order not found or missing paymentIntent', { status: 404 });
  }

  try {
    const refund = await stripe.refunds.create({
      payment_intent: order.paymentIntentId,
    });

    await db.update(ordersTable)
      .set({ status: 'refunded' })
      .where(eq(ordersTable.id, orderId));

    return new Response(JSON.stringify({ success: true, refund }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
