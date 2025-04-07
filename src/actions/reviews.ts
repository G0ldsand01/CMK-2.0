import { ActionError, defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import { and, eq } from 'drizzle-orm';
import { reviewsTable } from '@/db/schema';
import db from '@/lib/db';
import { getUser } from '@/lib/user';
import { logSecurityEvent } from '.';

export const reviews = {
	create: defineAction({
		input: z.object({
			productId: z.number(),
			rating: z.number().min(1).max(5).int(),
		}),
		handler: async (input, context) => {
			const { productId, rating } = input;
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

			const [review] = await db
				.insert(reviewsTable)
				.values({
					productId,
					userId: user.getId(),
					rating,
				})
				.onConflictDoUpdate({
					target: [reviewsTable.userId, reviewsTable.productId],
					set: {
						rating,
					},
				})
				.returning();

			const allReviews = await db
				.select()
				.from(reviewsTable)
				.where(eq(reviewsTable.productId, productId));

			return {
				productId,
				review,
				allReviews,
			};
		},
	}),
	update: defineAction({
		input: z.object({
			productId: z.number(),
			rating: z.number().min(1).max(5).int(),
		}),
		handler: async (input, context) => {
			const { productId, rating } = input;
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

			const [review] = await db
				.update(reviewsTable)
				.set({
					rating,
				})
				.where(
					and(
						eq(reviewsTable.userId, user.getId()),
						eq(reviewsTable.productId, productId),
					),
				)
				.returning();

			const allReviews = await db
				.select()
				.from(reviewsTable)
				.where(eq(reviewsTable.productId, productId));

			return {
				productId,
				review,
				allReviews,
			};
		},
	}),
	delete: defineAction({
		input: z.object({
			productId: z.number(),
		}),
		handler: async (input, ctx) => {
			const { productId } = input;
			const user = await getUser(ctx.request);

			if (!user) {
				logSecurityEvent('UNAUTHORIZED_ACCESS', 'anonymous', {
					ip: ctx.request.headers.get('x-forwarded-for'),
				});
				throw new ActionError({
					code: 'UNAUTHORIZED',
					message: 'User must be logged in.',
				});
			}

			await db
				.delete(reviewsTable)
					.where(
						and(
							eq(reviewsTable.userId, user.getId()),
							eq(reviewsTable.productId, productId),
						),
					);

				const allReviews = await db
					.select()
					.from(reviewsTable)
					.where(eq(reviewsTable.productId, productId));

				return {
					productId,
					review: null,
				allReviews,
			};
		},
	}),
};
