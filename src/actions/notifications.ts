import { ActionError, defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import { eq, desc, count, and } from 'drizzle-orm';
import { notificationsTable } from '@/db/schema';
import { authServer } from '@/lib/auth-server';
import db from '@/lib/db';

export const notifications = {
	getNotifications: defineAction({
		input: z.object({
			limit: z.number().optional().default(20),
			offset: z.number().optional().default(0),
			unreadOnly: z.boolean().optional().default(false),
		}),
		async handler(input, context) {
			const session = await authServer.api.getSession({
				headers: context.request.headers,
			});

			const currentUser = session?.user;
			if (!currentUser) {
				throw new ActionError({
					code: 'UNAUTHORIZED',
					message: 'User must be logged in.',
				});
			}

			try {
				const conditions = [eq(notificationsTable.userId, currentUser.id)];
				if (input.unreadOnly) {
					conditions.push(eq(notificationsTable.read, false));
				}

				const whereClause = and(...conditions);

				// Get total count
				const totalResult = await db
					.select({ count: count() })
					.from(notificationsTable)
					.where(whereClause);
				const total = totalResult[0]?.count || 0;

				// Get notifications
				const notifications = await db
					.select()
					.from(notificationsTable)
					.where(whereClause)
					.orderBy(desc(notificationsTable.createdAt))
					.limit(input.limit)
					.offset(input.offset);

				const formattedNotifications = notifications.map((notif) => ({
					id: notif.id,
					userId: notif.userId,
					title: notif.title,
					message: notif.message,
					type: notif.type,
					read: notif.read,
					createdAt:
						notif.createdAt instanceof Date
							? notif.createdAt
							: new Date(notif.createdAt),
				}));

				return {
					data: formattedNotifications,
					total,
					unreadCount: input.unreadOnly
						? total
						: await db
								.select({ count: count() })
								.from(notificationsTable)
								.where(
									and(
										eq(notificationsTable.userId, currentUser.id),
										eq(notificationsTable.read, false),
									),
								)
								.then((r) => r[0]?.count || 0),
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

	markAsRead: defineAction({
		input: z.object({
			notificationId: z.number(),
		}),
		async handler(input, context) {
			const session = await authServer.api.getSession({
				headers: context.request.headers,
			});

			const currentUser = session?.user;
			if (!currentUser) {
				throw new ActionError({
					code: 'UNAUTHORIZED',
					message: 'User must be logged in.',
				});
			}

			try {
				await db
					.update(notificationsTable)
					.set({ read: true })
					.where(
						and(
							eq(notificationsTable.id, input.notificationId),
							eq(notificationsTable.userId, currentUser.id),
						),
					);

				return {
					success: true,
				};
			} catch (error) {
				console.error('Error marking notification as read:', error);
				throw new ActionError({
					code: 'INTERNAL_ERROR',
					message: 'Failed to mark notification as read',
				});
			}
		},
	}),

	markAllAsRead: defineAction({
		input: z.object({}),
		async handler(input, context) {
			const session = await authServer.api.getSession({
				headers: context.request.headers,
			});

			const currentUser = session?.user;
			if (!currentUser) {
				throw new ActionError({
					code: 'UNAUTHORIZED',
					message: 'User must be logged in.',
				});
			}

			try {
				await db
					.update(notificationsTable)
					.set({ read: true })
					.where(
						and(
							eq(notificationsTable.userId, currentUser.id),
							eq(notificationsTable.read, false),
						),
					);

				return {
					success: true,
				};
			} catch (error) {
				console.error('Error marking all notifications as read:', error);
				throw new ActionError({
					code: 'INTERNAL_ERROR',
					message: 'Failed to mark all notifications as read',
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
			if (!currentUser) {
				throw new ActionError({
					code: 'UNAUTHORIZED',
					message: 'User must be logged in.',
				});
			}

			try {
				await db
					.delete(notificationsTable)
					.where(
						and(
							eq(notificationsTable.id, input.notificationId),
							eq(notificationsTable.userId, currentUser.id),
						),
					);

				return {
					success: true,
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
