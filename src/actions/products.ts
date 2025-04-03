import { ActionError, defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import { productsTable, reviewsTable, wishlistTable } from '@/db/schema';
import db from '@/lib/db';
import { getUser } from '@/lib/user';
import { and, desc, eq } from 'drizzle-orm';
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
	getProductById: defineAction({
		input: z.object({
			id: z.number(),
		}),
		handler: async (input, ctx) => {
			const products = await db.query.productsTable.findMany({
				where: eq(productsTable.id, input.id),
			});

			const product = products.find((doc) => doc.id === input.id);

			const user = await getUser(ctx.request);
			if (user?.getId()) {
				const wishlist = await db.query.wishlistTable.findMany({
					where: and(
						eq(wishlistTable.userId, user.getId()),
						eq(wishlistTable.productId, input.id),
					),
				});
				return { product, isInWishlist: wishlist.length > 0 };
			}

			return { product, isInWishlist: false };
		},
	}),
	// getProductsByCategory: defineAction({
	//   input: z.object({
	//     category: z.string(),
	//   }),
	//   handler: async (input) => {
	//     const products = await db.query.productsTable.findMany({
	//       where: eq(productsTable.category, input.category),
	//     });
	//     return products;
	//   },
	// }),
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

	getHighestId: defineAction({
		handler: async () => {
			const [highestId] = await db.query.productsTable.findMany({
				orderBy: desc(productsTable.id),
			});

			return highestId?.id || 0;
		},
	}),
	addProduct: defineAction({
		input: z.object({
			name: z.string(),
			price: z.number(),
			description: z.string(),
			image: z.string(),
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

			const newProduct = {
				name: input.name,
				price: input.price.toString(),
				description: input.description,
				image: input.image,
				category: input.category,
				stock: input.stock,
				rating: '0', // Default value for rating
				reviews: '0', // Default value for reviews
			};

			await db.insert(productsTable).values(newProduct);

			return newProduct;
		},
	}),
	// addReview: defineAction({
	//   input: z.object({
	//     productId: z.number(),
	//     rating: z.number(),
	//   }),
	//   handler: async (input, context) => {
	//     const user = await getUser(context.request);

	//     if (!user) {
	//       logSecurityEvent('UNAUTHORIZED_ACCESS', 'anonymous', {
	//         ip: context.request.headers.get('x-forwarded-for'),
	//       });
	//       throw new ActionError({
	//         code: 'UNAUTHORIZED',
	//         message: 'User must be logged in.',
	//       });
	//     }

	//     const [product] = await db.query.productsTable.findMany({
	//       where: eq(productsTable.id, input.productId),
	//       limit: 1,
	//     });

	//     if (!product) {
	//       throw new ActionError({
	//         code: 'NOT_FOUND',
	//         message: 'Product not found',
	//       });
	//     }

	//     const newReview = {
	//       user: user.getId(),
	//       productId: input.productId,
	//       rating: input.rating,
	//       comment: '',
	//     };

	//     await db.insert(reviewsTable).values(newReview);

	//     return newReview;
	//   },
	// }),
};
