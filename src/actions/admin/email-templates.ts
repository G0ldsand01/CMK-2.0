import { ActionError, defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import { eq, desc } from 'drizzle-orm';
import { emailTemplatesTable } from '@/db/schema';
import { authServer } from '@/lib/auth-server';
import db from '@/lib/db';
import { logSecurityEvent } from '../index';

export const emailTemplates = {
	getTemplates: defineAction({
		input: z.object({
			type: z
				.enum(['order_confirmation', 'password_reset', 'welcome', 'custom'])
				.optional(),
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
				let query = db
					.select()
					.from(emailTemplatesTable)
					.orderBy(desc(emailTemplatesTable.createdAt));

				if (input.type) {
					query = query.where(eq(emailTemplatesTable.type, input.type)) as any;
				}

				const templates = await query;

				return {
					data: templates.map((t) => ({
						id: t.id,
						name: t.name,
						subject: t.subject,
						body: t.body,
						type: t.type,
						createdAt:
							t.createdAt instanceof Date ? t.createdAt : new Date(t.createdAt),
						updatedAt:
							t.updatedAt instanceof Date ? t.updatedAt : new Date(t.updatedAt),
					})),
				};
			} catch (error) {
				console.error('Error fetching email templates:', error);
				throw new ActionError({
					code: 'INTERNAL_ERROR',
					message: 'Failed to fetch email templates',
				});
			}
		},
	}),

	getTemplate: defineAction({
		input: z.object({
			id: z.number(),
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
				const [template] = await db
					.select()
					.from(emailTemplatesTable)
					.where(eq(emailTemplatesTable.id, input.id))
					.limit(1);

				if (!template) {
					throw new ActionError({
						code: 'NOT_FOUND',
						message: 'Template not found',
					});
				}

				return {
					data: {
						id: template.id,
						name: template.name,
						subject: template.subject,
						body: template.body,
						type: template.type,
						createdAt:
							template.createdAt instanceof Date
								? template.createdAt
								: new Date(template.createdAt),
						updatedAt:
							template.updatedAt instanceof Date
								? template.updatedAt
								: new Date(template.updatedAt),
					},
				};
			} catch (error) {
				if (error instanceof ActionError) {
					throw error;
				}
				console.error('Error fetching email template:', error);
				throw new ActionError({
					code: 'INTERNAL_ERROR',
					message: 'Failed to fetch email template',
				});
			}
		},
	}),

	createTemplate: defineAction({
		input: z.object({
			name: z.string().min(1, 'Name is required'),
			subject: z.string().min(1, 'Subject is required'),
			body: z.string().min(1, 'Body is required'),
			type: z
				.enum(['order_confirmation', 'password_reset', 'welcome', 'custom'])
				.default('custom'),
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
				const [template] = await db
					.insert(emailTemplatesTable)
					.values({
						name: input.name,
						subject: input.subject,
						body: input.body,
						type: input.type,
						createdAt: new Date(),
						updatedAt: new Date(),
					})
					.returning();

				await logSecurityEvent(
					'EMAIL_TEMPLATE_CREATED',
					currentUser.id,
					{
						templateId: template.id,
						templateName: template.name,
					},
					context.request.headers.get('x-forwarded-for'),
					context.request.headers.get('user-agent'),
				);

				return {
					success: true,
					data: {
						id: template.id,
						name: template.name,
						subject: template.subject,
						body: template.body,
						type: template.type,
						createdAt: template.createdAt,
						updatedAt: template.updatedAt,
					},
				};
			} catch (error) {
				console.error('Error creating email template:', error);
				throw new ActionError({
					code: 'INTERNAL_ERROR',
					message: 'Failed to create email template',
				});
			}
		},
	}),

	updateTemplate: defineAction({
		input: z.object({
			id: z.number(),
			name: z.string().min(1, 'Name is required').optional(),
			subject: z.string().min(1, 'Subject is required').optional(),
			body: z.string().min(1, 'Body is required').optional(),
			type: z
				.enum(['order_confirmation', 'password_reset', 'welcome', 'custom'])
				.optional(),
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
				const updateData: {
					name?: string;
					subject?: string;
					body?: string;
					type?: string;
					updatedAt: Date;
				} = {
					updatedAt: new Date(),
				};

				if (input.name !== undefined) updateData.name = input.name;
				if (input.subject !== undefined) updateData.subject = input.subject;
				if (input.body !== undefined) updateData.body = input.body;
				if (input.type !== undefined) updateData.type = input.type;

				const [template] = await db
					.update(emailTemplatesTable)
					.set(updateData)
					.where(eq(emailTemplatesTable.id, input.id))
					.returning();

				if (!template) {
					throw new ActionError({
						code: 'NOT_FOUND',
						message: 'Template not found',
					});
				}

				await logSecurityEvent(
					'EMAIL_TEMPLATE_UPDATED',
					currentUser.id,
					{
						templateId: template.id,
						templateName: template.name,
					},
					context.request.headers.get('x-forwarded-for'),
					context.request.headers.get('user-agent'),
				);

				return {
					success: true,
					data: {
						id: template.id,
						name: template.name,
						subject: template.subject,
						body: template.body,
						type: template.type,
						createdAt:
							template.createdAt instanceof Date
								? template.createdAt
								: new Date(template.createdAt),
						updatedAt:
							template.updatedAt instanceof Date
								? template.updatedAt
								: new Date(template.updatedAt),
					},
				};
			} catch (error) {
				if (error instanceof ActionError) {
					throw error;
				}
				console.error('Error updating email template:', error);
				throw new ActionError({
					code: 'INTERNAL_ERROR',
					message: 'Failed to update email template',
				});
			}
		},
	}),

	deleteTemplate: defineAction({
		input: z.object({
			id: z.number(),
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
				const [template] = await db
					.delete(emailTemplatesTable)
					.where(eq(emailTemplatesTable.id, input.id))
					.returning();

				if (!template) {
					throw new ActionError({
						code: 'NOT_FOUND',
						message: 'Template not found',
					});
				}

				await logSecurityEvent(
					'EMAIL_TEMPLATE_DELETED',
					currentUser.id,
					{
						templateId: template.id,
						templateName: template.name,
					},
					context.request.headers.get('x-forwarded-for'),
					context.request.headers.get('user-agent'),
				);

				return {
					success: true,
					message: 'Template deleted successfully',
				};
			} catch (error) {
				if (error instanceof ActionError) {
					throw error;
				}
				console.error('Error deleting email template:', error);
				throw new ActionError({
					code: 'INTERNAL_ERROR',
					message: 'Failed to delete email template',
				});
			}
		},
	}),
};
