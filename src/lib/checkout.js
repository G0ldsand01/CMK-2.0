import { STRIPE_SECRET_KEY } from 'astro:env/server';
import Stripe from 'stripe';

const stripe = new Stripe(STRIPE_SECRET_KEY);

export default async function handler(req, res) {
	if (req.method !== 'POST') {
		return res.status(405).json({ error: 'Method Not Allowed' });
	}

	try {
		const { items } = req.body;

		const lineItems = items.map((item) => ({
			price_data: {
				currency: 'usd',
				product_data: {
					name: item.name,
				},
				unit_amount: Math.round(item.price * 100), // Convert price to cents
			},
			quantity: 1,
		}));

		const session = await stripe.checkout.sessions.create({
			payment_method_types: ['card'],
			line_items: lineItems,
			mode: 'payment',
			success_url: `${process.env.NEXT_PUBLIC_CLIENT_URL}/success`,
			cancel_url: `${process.env.NEXT_PUBLIC_CLIENT_URL}/cancel`,
		});

		res.status(200).json({ url: session.url });
	} catch (error) {
		console.error('Stripe Checkout Error:', error);
		res.status(500).json({ error: 'Unable to create checkout session' });
	}
}
