// src/pages/api/stripe/create-session.ts
import type { APIRoute } from 'astro';
import { stripe } from '@/lib/stripe';
import db from '@/lib/db';
import { ordersTable, user } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const POST: APIRoute = async ({ request }) => {
	try {
		const data = await request.json();

		// Basic validation
		const required = ['firstName', 'lastName', 'email', 'price', 'filename'];
		for (const key of required) {
			if (!data[key]) {
				return new Response(
					JSON.stringify({ error: `Missing required field: ${key}` }),
					{
						status: 400,
						headers: { 'Content-Type': 'application/json' },
					},
				);
			}
		}

		// Create Stripe checkout session
		const session = await stripe.checkout.sessions.create({
			mode: 'payment',
			payment_method_types: ['card'],
			customer_email: data.email,
			line_items: [
				{
					price_data: {
						currency: 'cad',
						product_data: {
							name: `3D Print: ${data.filename}`,
							description: `Material: ${data.material || 'PLA'}, Color: ${data.color || 'Default'}`,
						},
						unit_amount: Math.round(Number(data.price) * 100),
					},
					quantity: 1,
				},
			],
			success_url: `${new URL(request.url).origin}/success`,
			cancel_url: `${new URL(request.url).origin}/cancel`,
			metadata: {
				filename: data.filename,
				firstName: data.firstName,
				lastName: data.lastName,
				city: data.city || '',
				volume: data.volumeCm3?.toString() || '',
			},
		});

		// Find or get user by email
		let userId: string;
		const existingUser = await db
			.select()
			.from(user)
			.where(eq(user.email, data.email))
			.limit(1);

		if (existingUser.length > 0) {
			userId = existingUser[0].id;
		} else {
			// Create a temporary user ID or handle guest checkout
			// For now, we'll require an account - you may need to adjust this
			return new Response(
				JSON.stringify({
					error: 'User account required. Please sign up first.',
				}),
				{
					status: 400,
					headers: { 'Content-Type': 'application/json' },
				},
			);
		}

		// Create cartJSON for 3D print order
		const cartJSON = [
			{
				products: {
					id: 0, // Placeholder - no actual product for 3D prints
					name: `3D Print: ${data.filename}`,
					price: data.price.toString(),
					description: `Material: ${data.material || 'PLA'}, Color: ${data.color || 'Default'}`,
					thumbnail: null,
					category: 0,
					type: 'products' as const,
				},
				cart: {
					id: 0,
					userId: userId,
					productId: 0,
					quantity: 1,
				},
			},
		];

		// Save order
		await db.insert(ordersTable).values({
			userId: userId,
			stripeSessionId: session.id,
			status: 'pending',
			cartJSON: cartJSON,
		});

		return new Response(JSON.stringify({ url: session.url }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		});
	} catch (err) {
		console.error('Create-session error:', err);
		return new Response(JSON.stringify({ error: 'Internal server error' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' },
		});
	}
};
