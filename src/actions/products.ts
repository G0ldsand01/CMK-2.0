import { ActionError, defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import { eq } from 'drizzle-orm';
import { productsTable } from '@/db/schema';
import db from '@/lib/db';
import { getUser } from '@/lib/user';
import { logSecurityEvent } from './index';

export const products = {
	getBestProducts: defineAction({
		handler: async () => {
			const products = await db.query.productsTable.findMany({
				limit: 8,
			});
			return products;
		},
	}),
	getProductsBySearch: defineAction({
		input: z.object({
			search: z.string(),
		}),
		handler: async (input) => {
			const products = await db.query.productsTable.findMany({
				where: eq(productsTable.name, input.search),
			});
			return products;
		},
	}),
	getProductsByType: defineAction({
		input: z.object({
			type: z.string(),
		}),
		handler: async (input) => {
			const products = await db.query.productsTable.findMany({
				// @ts-expect-error 
				where: eq(productsTable.type, input.type),
				limit: 8,
			});
			return products;
		},
	}),
	addProduct: defineAction({
		input: z.object({
			name: z.string(),
			price: z.number(),
			description: z.string(),
			image: z.string(),
			type: z.string(),
			category: z.string(),
			stock: z.number(),
		}),
		handler: async (input, context) => {
			const user = await getUser(context.request);

			if (!user) {
				logSecurityEvent('UNAUTHORIZED_ACCESS', 'anonymous', {
					ip: context.request.headers.get('x-forwarded-for'),
				});
				throw new ActionError({
					code: 'UNAUTHORIZED',
					message: 'User must be logged in.',
				});
			}

			if (!user.isAdmin()) {
				logSecurityEvent('UNAUTHORIZED_ACCESS', user.getId(), {
					ip: context.request.headers.get('x-forwarded-for'),
				});
				throw new ActionError({
					code: 'UNAUTHORIZED',
					message: 'User must be an admin.',
				});
			}

			// if (!Object.values(productCategoryEnum).includes(input.category)) {
			// 	throw new ActionError({
			// 		code: 'BAD_REQUEST',
			// 		message: 'Invalid category.',
			// 	});
			// }

			const newProduct = {
				name: input.name,
				price: input.price.toString(),
				description: input.description,
				image: input.image,
				type: input.type,
				category: input.category,
				stock: input.stock,
			};

			// @ts-expect-error - TODO: fix this
			await db.insert(productsTable).values(newProduct);

			return newProduct;
		},
	}),
	
};
