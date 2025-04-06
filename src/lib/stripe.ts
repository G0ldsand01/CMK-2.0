// lib/stripe.ts
import { STRIPE_SECRET_KEY } from 'astro:env/server';
import Stripe from 'stripe';

export const stripe = new Stripe(STRIPE_SECRET_KEY, {
	apiVersion: '2025-03-31.basil',
});

export async function getOrdersByEmail(email: string) {
	const sessions = await stripe.checkout.sessions.list({
		limit: 10,
		expand: ['data.payment_intent'],
	});

	return sessions.data.filter((session) => session.customer_email === email);
}

// export async function createCheckoutSession(cartItems: any[]) {
// 	const session = await stripe.checkout.sessions.create({
// 		payment_method_types: ['card'],
// 		line_items: cartItems.map((item) => ({
// 			price_data: {
// 				currency: 'usd',
// 				product_data: {
// 					name: item.name,
// 				},
// 				unit_amount: item.price,
// 			},
// 			quantity: item.quantity,
// 		})),
// 		mode: 'payment',
// 		success_url: `${WEBSITE_URL}/success`,
// 		cancel_url: `${WEBSITE_URL}/cancel`,
// 	});

// 	return session;
// }
