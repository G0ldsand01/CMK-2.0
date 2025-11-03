// src/pages/api/stripe/create-session.ts
import type { APIRoute } from 'astro';
import { stripe } from '@/lib/stripe';
import db from '@/lib/db';
import { ordersTable } from '@/db/schema';
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
			cancel_url: `${new URL(request.url).origin}/3dprint`,
			metadata: {
				filename: data.filename,
				firstName: data.firstName,
				lastName: data.lastName,
				city: data.city || '',
				volume: data.volumeCm3?.toString() || '',
			},
		});

		// Save order
		await db.insert(ordersTable).values({
			stripeSessionId: session.id,
			email: data.email,
			filename: data.filename,
			amount: data.price,
			status: 'pending',
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
