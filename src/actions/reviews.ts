import { ActionError, defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import { eq } from 'drizzle-orm';
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
					rating,
					userId: user.getId(),
				})
				.returning();

			return review;
		},
	}),
	update: defineAction({
		input: z.object({
			rating: z.number().min(1).max(5).int(),
		}),
		handler: async (input, context) => {
			const { rating } = input;
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
				.where(eq(reviewsTable.userId, user.getId()))
				.returning();

			return review;
		},
	}),
	delete: defineAction({
		handler: async (_input, ctx) => {
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
				.where(eq(reviewsTable.userId, user.getId()));

			return true;
		},
	}),
};
