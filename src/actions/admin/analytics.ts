import { ActionError, defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import { authServer } from '@/lib/auth-server';
import { stripe } from '@/lib/stripe';
import { logSecurityEvent } from '../index';
import db from '@/lib/db';
import { reviewsTable, productsTable, ordersTable, user } from '@/db/schema';
import { count, eq, sql } from 'drizzle-orm';

export const analytics = {
	getAnalytics: defineAction({
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
				// Get Stripe metrics
				const balance = await stripe.balance.retrieve();
				const customers = await stripe.customers.list({ limit: 100 });

				// Get database metrics
				const totalProducts = await db
					.select({ count: count() })
					.from(productsTable);

				const totalReviews = await db
					.select({ count: count() })
					.from(reviewsTable);

				const totalUsers = await db.select({ count: count() }).from(user);

				const totalOrders = await db
					.select({ count: count() })
					.from(ordersTable);

				// Get revenue data from Stripe
				const revenueData = await stripe.balanceTransactions.list({
					type: 'charge',
					limit: 100,
				});

				const revenueByMonth: Record<string, number> = {};
				revenueData.data.forEach((txn) => {
					const date = new Date(txn.created * 1000);
					const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
					revenueByMonth[monthKey] =
						(revenueByMonth[monthKey] || 0) + txn.amount / 100;
				});

				// Get average rating
				const avgRating = await db
					.select({ avg: sql<number>`AVG(${reviewsTable.rating})` })
					.from(reviewsTable);

				return {
					revenue: {
						total: (balance.available[0]?.amount || 0) / 100,
						byMonth: revenueByMonth,
					},
					customers: {
						total: customers.data.length,
					},
					products: {
						total: totalProducts[0]?.count || 0,
					},
					reviews: {
						total: totalReviews[0]?.count || 0,
						averageRating: avgRating[0]?.avg ? Number(avgRating[0].avg) : 0,
					},
					users: {
						total: totalUsers[0]?.count || 0,
					},
					orders: {
						total: totalOrders[0]?.count || 0,
					},
				};
			} catch (error) {
				console.error('Error fetching analytics:', error);
				throw new ActionError({
					code: 'INTERNAL_ERROR',
					message: 'Failed to fetch analytics',
				});
			}
		},
	}),
};
