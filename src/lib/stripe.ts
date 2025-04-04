// lib/stripe.ts
import { STRIPE_SECRET_KEY } from 'astro:env/server';
import Stripe from 'stripe';

const stripe = new Stripe(STRIPE_SECRET_KEY, {
	apiVersion: '2025-03-31.basil',
});
// Function to get orders by email from Stripe API
export async function getOrdersByEmail(email: string) {
	const sessions = await stripe.checkout.sessions.list({
		limit: 10,
		expand: ['data.payment_intent'],
	});

	// Filter by customer_email
	return sessions.data.filter((session) => session.customer_email === email);
}

// Function to create a checkout session from list of items in cart
export async function createCheckoutSession(cartItems: any[]) {
	const session = await stripe.checkout.sessions.create({
		payment_method_types: ['card'],
		line_items: cartItems.map((item) => ({
			price_data: {
				currency: 'usd',
				product_data: {
					name: item.name,
				},
				unit_amount: item.price, // Convert price to cents
			},
			quantity: item.quantity,
		})),
		mode: 'payment',
		success_url: 'https://cmk-2-0-tau.vercel.app/success',
		cancel_url: 'https://cmk-2-0-tau.vercel.app/cancel',
	});

	return session;
}
