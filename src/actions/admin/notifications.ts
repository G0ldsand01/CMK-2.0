import { ActionError, defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import { eq, desc, count, and } from 'drizzle-orm';
import { notificationsTable, user } from '@/db/schema';
import { authServer } from '@/lib/auth-server';
import db from '@/lib/db';
import { logSecurityEvent } from '../index';

export const notifications = {
	getAllNotifications: defineAction({
		input: z.object({
			limit: z.number().optional().default(50),
			offset: z.number().optional().default(0),
			userId: z.string().optional(),
		}),
		async handler(input, context) {
			const session = await authServer.api.getSession({
				headers: context.request.headers,
			});

			const currentUser = session?.user;
			if (!currentUser || currentUser.role !== 'admin') {
				await logSecurityEvent(
					'UNAUTHORIZED_ACCESS',
					'anonymous',
					{
						ip: context.request.headers.get('x-forwarded-for'),
					},
					context.request.headers.get('x-forwarded-for'),
					context.request.headers.get('user-agent'),
				);
				throw new ActionError({
					code: 'UNAUTHORIZED',
					message: 'User must be logged in and be an admin.',
				});
			}

			try {
				const conditions = [];
				if (input.userId) {
					conditions.push(eq(notificationsTable.userId, input.userId));
				}

				const whereClause =
					conditions.length > 0 ? and(...conditions) : undefined;

				const totalResult = whereClause
					? await db
							.select({ count: count() })
							.from(notificationsTable)
							.where(whereClause)
					: await db.select({ count: count() }).from(notificationsTable);
				const total = totalResult[0]?.count || 0;

				let query = db
					.select({
						notification: notificationsTable,
						user: {
							id: user.id,
							name: user.name,
							email: user.email,
						},
					})
					.from(notificationsTable)
					.leftJoin(user, eq(notificationsTable.userId, user.id))
					.orderBy(desc(notificationsTable.createdAt))
					.limit(input.limit)
					.offset(input.offset);

				if (whereClause) {
					query = query.where(whereClause) as any;
				}

				const notifications = await query;

				const formattedNotifications = notifications.map((n) => ({
					id: n.notification.id,
					userId: n.notification.userId,
					title: n.notification.title,
					message: n.notification.message,
					type: n.notification.type,
					read: n.notification.read,
					createdAt:
						n.notification.createdAt instanceof Date
							? n.notification.createdAt
							: new Date(n.notification.createdAt),
					user: n.user
						? {
								id: n.user.id,
								name: n.user.name,
								email: n.user.email,
							}
						: null,
				}));

				return {
					data: formattedNotifications,
					total,
				};
			} catch (error) {
				console.error('Error fetching notifications:', error);
				throw new ActionError({
					code: 'INTERNAL_ERROR',
					message: 'Failed to fetch notifications',
				});
			}
		},
	}),

	createNotification: defineAction({
		input: z.object({
			userId: z.string(),
			title: z.string().min(1),
			message: z.string().min(1),
			type: z
				.enum(['info', 'warning', 'error', 'success'])
				.optional()
				.default('info'),
		}),
		async handler(input, context) {
			const session = await authServer.api.getSession({
				headers: context.request.headers,
			});

			const currentUser = session?.user;
			if (!currentUser || currentUser.role !== 'admin') {
				await logSecurityEvent(
					'UNAUTHORIZED_ACCESS',
					'anonymous',
					{
						ip: context.request.headers.get('x-forwarded-for'),
					},
					context.request.headers.get('x-forwarded-for'),
					context.request.headers.get('user-agent'),
				);
				throw new ActionError({
					code: 'UNAUTHORIZED',
					message: 'User must be logged in and be an admin.',
				});
			}

			try {
				const [notification] = await db
					.insert(notificationsTable)
					.values({
						userId: input.userId,
						title: input.title,
						message: input.message,
						type: input.type,
						read: false,
					})
					.returning();

				await logSecurityEvent(
					'NOTIFICATION_CREATED',
					currentUser.id,
					{
						targetUserId: input.userId,
						notificationId: notification.id,
					},
					context.request.headers.get('x-forwarded-for'),
					context.request.headers.get('user-agent'),
				);

				return {
					success: true,
					notification: {
						id: notification.id,
						userId: notification.userId,
						title: notification.title,
						message: notification.message,
						type: notification.type,
						read: notification.read,
						createdAt: notification.createdAt,
					},
				};
			} catch (error) {
				console.error('Error creating notification:', error);
				throw new ActionError({
					code: 'INTERNAL_ERROR',
					message: 'Failed to create notification',
				});
			}
		},
	}),

	deleteNotification: defineAction({
		input: z.object({
			notificationId: z.number(),
		}),
		async handler(input, context) {
			const session = await authServer.api.getSession({
				headers: context.request.headers,
			});

			const currentUser = session?.user;
			if (!currentUser || currentUser.role !== 'admin') {
				await logSecurityEvent(
					'UNAUTHORIZED_ACCESS',
					'anonymous',
					{
						ip: context.request.headers.get('x-forwarded-for'),
					},
					context.request.headers.get('x-forwarded-for'),
					context.request.headers.get('user-agent'),
				);
				throw new ActionError({
					code: 'UNAUTHORIZED',
					message: 'User must be logged in and be an admin.',
				});
			}

			try {
				await db
					.delete(notificationsTable)
					.where(eq(notificationsTable.id, input.notificationId));

				await logSecurityEvent(
					'NOTIFICATION_DELETED',
					currentUser.id,
					{
						notificationId: input.notificationId,
					},
					context.request.headers.get('x-forwarded-for'),
					context.request.headers.get('user-agent'),
				);

				return {
					success: true,
					message: 'Notification deleted successfully',
				};
			} catch (error) {
				console.error('Error deleting notification:', error);
				throw new ActionError({
					code: 'INTERNAL_ERROR',
					message: 'Failed to delete notification',
				});
			}
		},
	}),
};
