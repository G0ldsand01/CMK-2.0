import { ActionError, defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import { productsTable } from '@/db/schema';
import type { ProductType } from '@/db/schema';
import { uploadToCDN } from '@/lib/cdn';
import db from '@/lib/db';
import { getUser } from '@/lib/user';
import { count, eq } from 'drizzle-orm';
import { logSecurityEvent } from '..';

export const products = {
	getProducts: defineAction({
		input: z.object({
			limit: z.number().optional(),
			offset: z.number().optional(),
		}),
		async handler(input, context) {
			const user = await getUser(context.request);
			if (!user || !user.isAdmin()) {
				logSecurityEvent('UNAUTHORIZED_ACCESS', 'anonymous', {
					ip: context.request.headers.get('x-forwarded-for'),
				});
				throw new ActionError({
					code: 'UNAUTHORIZED',
					message: 'User must be logged in.',
				});
			}

			const { limit = 10, offset = 0 } = input;

			const data = await db.transaction(async (tx) => {
				const products = await tx.query.productsTable.findMany({
					offset: offset,
					limit: limit,
				});

				const [totalCount] = await tx
					.select({ count: count() })
					.from(productsTable);

				return {
					data: products,
					total: totalCount.count,
				};
			});

			return data;
		},
	}),

	updateProduct: defineAction({
		input: z.object({
			id: z.number(),
			name: z.string().min(2),
			description: z.string().min(10),
			price: z.string(),
			category: z.number(),
			type: z.string(),
			image: z.string().refine(
				(val) => {
					// Accept both standard URLs and our internal image paths
					if (val.startsWith('http://') || val.startsWith('https://')) {
						return true;
					}
					// Accept paths like /view/product-{id}-{hash}.png
					if (val.startsWith('/view/product-') && val.endsWith('.png')) {
						return true;
					}
					return false;
				},
				{
					message: 'Please enter a valid image URL or path.',
				},
			),
		}),
		async handler(input, context) {
			const user = await getUser(context.request);
			if (!user || !user.isAdmin()) {
				throw new ActionError({
					code: 'UNAUTHORIZED',
					message: 'User must be logged in and be an admin.',
				});
			}

			try {
				await db
					.update(productsTable)
					.set({
						name: input.name,
						description: input.description,
						price: input.price,
						category: input.category,
						type: input.type as ProductType,
						image: input.image,
					})
					.where(eq(productsTable.id, input.id));

				return {
					success: true,
				};
			} catch (error) {
				console.error('Error updating product:', error);
				return {
					success: false,
					error: 'Failed to update product',
				};
			}
		},
	}),
	addProduct: defineAction({
		input: z.object({
			name: z.string(),
			price: z.number(),
			description: z.string(),
			image: z.string().startsWith('data:image/'),
			type: z.string(),
			category: z.number(),
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
						category: input.category,
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
