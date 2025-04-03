import { ActionError, defineAction } from 'astro:actions';
import { z } from 'astro:content';
import { and, eq, sql } from 'drizzle-orm';
import { cartTable, productsTable } from '@/db/schema';
import db from '@/lib/db';
import { getUser } from '@/lib/user';
import { logSecurityEvent } from './index';

export const cart = {
	addProductIdToCart: defineAction({
		input: z.object({
			productId: z.string(),
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

			const { productId } = input;

			const cart = await db
				.select()
				.from(cartTable)
				.where(eq(cartTable.userId, user.getId()))
				.innerJoin(productsTable, eq(cartTable.productId, productsTable.id));

			if (cart.some((item) => item.products.id === Number(productId))) {
				return {
					success: false,
					cart: cart,
				};
			}

			await db
				.insert(cartTable)
				.values({
					userId: user.getId(),
					productId: Number(productId),
					quantity: 1,
				})
				.onConflictDoNothing()
				.returning();

			const newCart = await db
				.select()
				.from(cartTable)
				.where(eq(cartTable.userId, user.getId()))
				.innerJoin(productsTable, eq(cartTable.productId, productsTable.id));

			return {
				success: true,
				cart: newCart,
			};
		},
	}),
	updateCartItem: defineAction({
		input: z.object({
			productId: z.string(),
			increment: z.boolean().optional(),
			decrement: z.boolean().optional(),
		}),
		handler: async (input, context) => {
			const user = await getUser(context.request);

			if (!user) {
				throw new ActionError({
					code: 'UNAUTHORIZED',
					message: 'User must be logged in.',
				});
			}

			const { productId, increment, decrement } = input;

			return await db.transaction(async (tx) => {
				let set = {};

				if (increment) {
					set = { quantity: sql`${cartTable.quantity} + 1` };
				} else if (decrement) {
					set = { quantity: sql`${cartTable.quantity} - 1` };
				}

				await tx
					.update(cartTable)
					.set(set)
					.where(
						and(
							eq(cartTable.userId, user.getId()),
							eq(cartTable.productId, Number(productId)),
						),
					);

				const cart = await tx
					.select()
					.from(cartTable)
					.where(eq(cartTable.userId, user.getId()))
					.innerJoin(productsTable, eq(cartTable.productId, productsTable.id));

				return {
					success: true,
					cart: cart,
				};
			});
		},
	}),
	deleteCartItem: defineAction({
		input: z.object({
			productId: z.string(),
		}),
		handler: async (input, context) => {
			const user = await getUser(context.request);

			if (!user) {
				throw new ActionError({
					code: 'UNAUTHORIZED',
					message: 'User must be logged in.',
				});
			}

			const { productId } = input;

			return await db.transaction(async (tx) => {
				await tx
					.delete(cartTable)
					.where(
						and(
							eq(cartTable.userId, user.getId()),
							eq(cartTable.productId, Number(productId)),
						),
					);

				const cart = await tx
					.select()
					.from(cartTable)
					.where(eq(cartTable.userId, user.getId()))
					.innerJoin(productsTable, eq(cartTable.productId, productsTable.id));

				return {
					success: true,
					cart: cart,
				};
			});
		},
	}),
};
