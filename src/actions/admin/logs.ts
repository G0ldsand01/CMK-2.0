import { ActionError, defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import { desc, eq, like, count, and, or } from 'drizzle-orm';
import { securityLogsTable } from '@/db/schema';
import { authServer } from '@/lib/auth-server';
import db from '@/lib/db';
import { logSecurityEvent } from '../index';

export const logs = {
	getLogs: defineAction({
		input: z.object({
			limit: z.number().optional().default(100),
			offset: z.number().optional().default(0),
			search: z.string().optional(),
			eventType: z.string().optional(),
		}),
		async handler(input, context) {
			const session = await authServer.api.getSession({
				headers: context.request.headers,
			});

			const currentUser = session?.user;
			if (!currentUser || currentUser.role !== 'admin') {
				logSecurityEvent(
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
				// Build where conditions
				const conditions = [];
				if (input.search) {
					conditions.push(like(securityLogsTable.event, `%${input.search}%`));
				}
				if (input.eventType) {
					conditions.push(eq(securityLogsTable.event, input.eventType));
				}

				const whereClause =
					conditions.length > 0 ? and(...conditions) : undefined;

				// Get total count
				const totalResult = whereClause
					? await db
							.select({ count: count() })
							.from(securityLogsTable)
							.where(whereClause)
					: await db.select({ count: count() }).from(securityLogsTable);
				const total = totalResult[0]?.count || 0;

				// Get logs
				let query = db
					.select()
					.from(securityLogsTable)
					.orderBy(desc(securityLogsTable.createdAt))
					.limit(input.limit)
					.offset(input.offset);

				if (whereClause) {
					query = query.where(whereClause) as any;
				}

				const logs = await query;

				const formattedLogs = logs.map((log) => ({
					id: log.id.toString(),
					event: log.event,
					userId: log.userId,
					details: log.details || {},
					ip: log.ip,
					userAgent: log.userAgent,
					timestamp:
						log.createdAt instanceof Date
							? log.createdAt
							: new Date(log.createdAt),
					severity: getSeverity(log.event),
				}));

				return {
					data: formattedLogs,
					total,
				};
			} catch (error) {
				console.error('Error fetching security logs:', error);
				throw new ActionError({
					code: 'INTERNAL_ERROR',
					message: 'Failed to fetch security logs',
				});
			}
		},
	}),

	deleteLog: defineAction({
		input: z.object({
			logId: z.number(),
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
					.delete(securityLogsTable)
					.where(eq(securityLogsTable.id, input.logId));

				await logSecurityEvent(
					'LOG_DELETED',
					currentUser.id,
					{
						logId: input.logId,
					},
					context.request.headers.get('x-forwarded-for'),
					context.request.headers.get('user-agent'),
				);

				return {
					success: true,
					message: 'Log deleted successfully',
				};
			} catch (error) {
				console.error('Error deleting log:', error);
				throw new ActionError({
					code: 'INTERNAL_ERROR',
					message: 'Failed to delete log',
				});
			}
		},
	}),
};

function getSeverity(event: string): 'info' | 'warning' | 'error' | 'success' {
	const eventUpper = event.toUpperCase();
	if (
		eventUpper.includes('UNAUTHORIZED') ||
		eventUpper.includes('FAILED') ||
		eventUpper.includes('ERROR')
	) {
		return 'error';
	}
	if (eventUpper.includes('WARNING') || eventUpper.includes('SUSPICIOUS')) {
		return 'warning';
	}
	if (
		eventUpper.includes('SUCCESS') ||
		eventUpper.includes('CREATED') ||
		eventUpper.includes('UPDATED')
	) {
		return 'success';
	}
	return 'info';
}
