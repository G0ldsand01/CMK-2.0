import { ActionError, defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import {
	type ProductCategory,
	type ProductType,
	productsTable,
} from '@/db/schema';
import { uploadToCDN } from '@/lib/cdn';
import db from '@/lib/db';
import { getUser } from '@/lib/user';
import { eq } from 'drizzle-orm';
import { logSecurityEvent } from './index';

export const products = {
	getBestProducts: defineAction({
		handler: async () => {
			const products = await db.query.productsTable.findMany({
				limit: 32,
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
				limit: 32,
			});
			return products;
		},
	}),
	addProduct: defineAction({
		input: z.object({
			name: z.string(),
			price: z.number(),
			description: z.string(),
			image: z.string().startsWith('data:image/'),
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

			// Validate that the image is a base64 string
			if (!input.image || !input.image.startsWith('data:image/')) {
				throw new ActionError({
					code: 'BAD_REQUEST',
					message: 'Invalid image format. Please upload a valid image.',
				});
			}

			try {
				// Upload image to CDN
				const cdnResponse = await uploadToCDN(input.image);

				if (!cdnResponse.success || !cdnResponse.url) {
					throw new Error(
						cdnResponse.message || 'Failed to upload image to CDN',
					);
				}

				// Create the product with the image URL
				const [product] = await db
					.insert(productsTable)
					.values({
						name: input.name,
						price: input.price.toString(),
						description: input.description,
						image: cdnResponse.url,
						type: input.type as ProductType,
						category: input.category as ProductCategory,
					})
					.returning();

				return product;
			} catch (error) {
				console.error('Error creating product:', error);
				return {
					success: false,
					error:
						error instanceof Error ? error.message : 'Failed to create product',
				};
			}
		},
	}),
};
