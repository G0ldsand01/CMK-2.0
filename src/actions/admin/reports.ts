import { ActionError, defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import { authServer } from '@/lib/auth-server';
import { stripe } from '@/lib/stripe';
import { logSecurityEvent } from '../index';
import db from '@/lib/db';
import { reviewsTable, productsTable, ordersTable, user } from '@/db/schema';
import { count, desc, eq, sql } from 'drizzle-orm';

export const reports = {
	generateSalesReport: defineAction({
		input: z.object({
			startDate: z.string().optional(),
			endDate: z.string().optional(),
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
				const revenueData = await stripe.balanceTransactions.list({
					type: 'charge',
					limit: 100,
				});

				const orders = await db
					.select()
					.from(ordersTable)
					.orderBy(desc(ordersTable.createdAt))
					.limit(100);

				return {
					revenue: revenueData.data.map((txn) => ({
						date: new Date(txn.created * 1000).toISOString(),
						amount: txn.amount / 100,
						currency: txn.currency,
						description: txn.description,
					})),
					orders: orders.map((order) => ({
						id: order.id,
						status: order.status,
						total: order.total,
						createdAt: order.createdAt,
					})),
				};
			} catch (error) {
				console.error('Error generating sales report:', error);
				throw new ActionError({
					code: 'INTERNAL_ERROR',
					message: 'Failed to generate sales report',
				});
			}
		},
	}),

	generateProductReport: defineAction({
		input: z.object({}),
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
				const products = await db.select().from(productsTable).limit(100);

				const productsWithReviews = await Promise.all(
					products.map(async (product) => {
						const reviews = await db
							.select({
								count: count(),
								avg: sql<number>`AVG(${reviewsTable.rating})`,
							})
							.from(reviewsTable)
							.where(eq(reviewsTable.productId, product.id));

						return {
							...product,
							reviewCount: reviews[0]?.count || 0,
							averageRating: reviews[0]?.avg ? Number(reviews[0].avg) : 0,
						};
					}),
				);

				return {
					products: productsWithReviews,
				};
			} catch (error) {
				console.error('Error generating product report:', error);
				throw new ActionError({
					code: 'INTERNAL_ERROR',
					message: 'Failed to generate product report',
				});
			}
		},
	}),
};
