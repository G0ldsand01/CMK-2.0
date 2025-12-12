import { ActionError, defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import { eq, desc, asc, count } from 'drizzle-orm';
import { reviewsTable, productsTable, user } from '@/db/schema';
import { authServer } from '@/lib/auth-server';
import db from '@/lib/db';
import { logSecurityEvent } from '../index';

export const reviews = {
	getReviews: defineAction({
		input: z.object({
			limit: z.number().optional().default(50),
			offset: z.number().optional().default(0),
			sortBy: z
				.enum(['createdAt', 'rating', 'productId'])
				.optional()
				.default('createdAt'),
			sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
		}),
		async handler(input, context) {
			const session = await authServer.api.getSession({
				headers: context.request.headers,
			});

			const currentUser = session?.user;
			if (!currentUser || currentUser.role !== 'admin') {
				logSecurityEvent('UNAUTHORIZED_ACCESS', 'anonymous', {
					ip: context.request.headers.get('x-forwarded-for'),
				});
				throw new ActionError({
					code: 'UNAUTHORIZED',
					message: 'User must be logged in and be an admin.',
				});
			}

			try {
				// Get total count
				const totalResult = await db
					.select({ count: count() })
					.from(reviewsTable);
				const total = totalResult[0]?.count || 0;

				// Apply sorting
				const sortColumn =
					input.sortBy === 'createdAt'
						? reviewsTable.createdAt
						: input.sortBy === 'rating'
							? reviewsTable.rating
							: reviewsTable.productId;

				// Build query with sorting and pagination
				let query = db
					.select({
						review: reviewsTable,
						product: productsTable,
						user: {
							id: user.id,
							name: user.name,
							email: user.email,
						},
					})
					.from(reviewsTable)
					.leftJoin(productsTable, eq(reviewsTable.productId, productsTable.id))
					.leftJoin(user, eq(reviewsTable.userId, user.id));

				if (input.sortOrder === 'asc') {
					query = query.orderBy(asc(sortColumn)) as any;
				} else {
					query = query.orderBy(desc(sortColumn)) as any;
				}

				// Apply pagination
				const reviews = await query.limit(input.limit).offset(input.offset);

				const formattedReviews = reviews.map((r) => ({
					id: r.review.id,
					productId: r.review.productId,
					userId: r.review.userId,
					rating: r.review.rating,
					createdAt: r.review.createdAt,
					product: r.product
						? {
								id: r.product.id,
								name: r.product.name,
							}
						: null,
					user: r.user
						? {
								id: r.user.id,
								name: r.user.name,
								email: r.user.email,
							}
						: null,
				}));

				return {
					data: formattedReviews,
					total,
				};
			} catch (error) {
				console.error('Error fetching reviews:', error);
				throw new ActionError({
					code: 'INTERNAL_ERROR',
					message: 'Failed to fetch reviews',
				});
			}
		},
	}),

	deleteReview: defineAction({
		input: z.object({
			reviewId: z.number(),
		}),
		async handler(input, context) {
			const session = await authServer.api.getSession({
				headers: context.request.headers,
			});

			const currentUser = session?.user;
			if (!currentUser || currentUser.role !== 'admin') {
				logSecurityEvent('UNAUTHORIZED_ACCESS', 'anonymous', {
					ip: context.request.headers.get('x-forwarded-for'),
				});
				throw new ActionError({
					code: 'UNAUTHORIZED',
					message: 'User must be logged in and be an admin.',
				});
			}

			try {
				await db
					.delete(reviewsTable)
					.where(eq(reviewsTable.id, input.reviewId));

				logSecurityEvent('REVIEW_DELETED', currentUser.id, {
					reviewId: input.reviewId,
				});

				return {
					success: true,
					message: 'Review deleted successfully',
				};
			} catch (error) {
				console.error('Error deleting review:', error);
				throw new ActionError({
					code: 'INTERNAL_ERROR',
					message: 'Failed to delete review',
				});
			}
		},
	}),
};
