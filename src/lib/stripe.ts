import { STRIPE_SECRET_KEY } from 'astro:env/server';
import Stripe from 'stripe';

export const stripe = new Stripe(STRIPE_SECRET_KEY, {
	apiVersion: '2025-08-27.basil',
});

export async function getOrdersByEmail(email: string) {
	const sessions = await stripe.checkout.sessions.list({
		limit: 10,
		expand: ['data.payment_intent'],
	});

	return sessions.data.filter((session) => session.customer_email === email);
}
