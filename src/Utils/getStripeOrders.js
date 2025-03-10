import Stripe from 'stripe';


const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-03-07'
});

export async function getStripeOrders() {
  try {
    const paymentIntents = await stripe.paymentIntents.list({ limit: 20 });

    return paymentIntents.data.map(intent => ({
      orderId: intent.id,
      orderDate: new Date(intent.created * 1000).toLocaleDateString(),
      status: intent.status,
      total: (intent.amount / 100).toFixed(2) // Convertir les centimes en dollars/euros
    }));
  } catch (error) {
    console.error('Error fetching Stripe orders:', error);
    return [];
  }
}
