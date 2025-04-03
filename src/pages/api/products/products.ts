import type { APIRoute } from 'astro';
import { productsTable } from '@/db/schema';
import db from '@/lib/db';

export const GET: APIRoute = async ({ redirect, cookies }) => {
	let product = await db.query.productsTable.findMany();

	if (!product) {
		return new Response(JSON.stringify({ error: 'No product found' }), {
			status: 404,
		});
	}

	if (product.length < 1) {
		const seeding: (typeof productsTable.$inferInsert)[] = [
			{
				id: 1,
				name: 'Mouse',
				price: '100',
				image: 'mouse',
				description: 'A high-quality mouse',
				category: 'mouse',
			},
			{
				id: 2,
				name: 'Keyboard',
				price: '50',
				image: 'keyboard',
				description: 'A high-quality keyboard',
				category: 'keyboard',
			},
			{
				id: 3,
				name: 'Headset',
				price: '300',
				image: 'headset',
				description: 'A high-quality headset',
				category: 'headset',
			},
			{
				id: 4,
				name: 'Mouse',
				price: '100',
				image: 'mouse',
				description: 'A high-quality mouse',
				category: 'mouse',
			},
			{
				id: 5,
				name: 'Keyboard',
				price: '50',
				image: 'keyboard',
				description: 'A high-quality keyboard',
				category: 'keyboard',
			},
			{
				id: 6,
				name: 'Headset',
				price: '300',
				image: 'headset',
				description: 'A high-quality headset',
				category: 'headset',
			},
			{
				id: 7,
				name: 'Mouse',
				price: '100',
				image: 'mouse',
				description: 'A high-quality mouse',
				category: 'mouse',
			},
			{
				id: 8,
				name: 'Keyboard',
				price: '50',
				image: 'keyboard',
				description: 'A high-quality keyboard',
				category: 'keyboard',
			},
			{
				id: 9,
				name: 'Headset',
				price: '300',
				image: 'headset',
				description: 'A high-quality headset',
				category: 'headset',
			},
		];

		await db.insert(productsTable).values(seeding);

		product = await db.query.productsTable.findMany();
	}

	return new Response(JSON.stringify(product), {
		status: 200,
	});
};
