import { ActionError, defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import { eq } from 'drizzle-orm';
import { productCategoryTable } from '@/db/schema';
import { authServer } from '@/lib/auth-server';
import db from '@/lib/db';

export const category = {
	getCategories: defineAction({
		async handler(_input, context) {
			const session = await authServer.api.getSession({
				headers: context.request.headers,
			});

			const user = session?.user;
			if (!user || user.role !== 'admin') {
				throw new ActionError({
					code: 'UNAUTHORIZED',
					message: 'User must be logged in and be an admin.',
				});
			}

			const categories = await db.query.productCategoryTable.findMany({});

			return categories;
		},
	}),

	createCategory: defineAction({
		input: z.object({
			name: z.string().min(2, {
				message: 'Name must be at least 2 characters.',
			}),
		}),
		async handler(input, context) {
			const session = await authServer.api.getSession({
				headers: context.request.headers,
			});

			const user = session?.user;
			if (!user || user.role !== 'admin') {
				throw new ActionError({
					code: 'UNAUTHORIZED',
					message: 'User must be logged in and be an admin.',
				});
			}

			try {
				const [newCategory] = await db
					.insert(productCategoryTable)
					.values({
						name: input.name,
					})
					.returning();

				return { success: true, category: newCategory };
			} catch (error) {
				console.error('Error creating category:', error);
				throw new ActionError({
					code: 'INTERNAL_SERVER_ERROR',
					message: 'Failed to create category.',
				});
			}
		},
	}),

	updateCategory: defineAction({
		input: z.object({
			id: z.number(),
			name: z.string().min(2, {
				message: 'Name must be at least 2 characters.',
			}),
		}),
		async handler(input, context) {
			const session = await authServer.api.getSession({
				headers: context.request.headers,
			});

			const user = session?.user;
			if (!user || user.role !== 'admin') {
				throw new ActionError({
					code: 'UNAUTHORIZED',
					message: 'User must be logged in and be an admin.',
				});
			}

			try {
				const [updatedCategory] = await db
					.update(productCategoryTable)
					.set({
						name: input.name,
					})
					.where(eq(productCategoryTable.id, input.id))
					.returning();

				return { success: true, category: updatedCategory };
			} catch (error) {
				console.error('Error updating category:', error);
				throw new ActionError({
					code: 'INTERNAL_SERVER_ERROR',
					message: 'Failed to update category.',
				});
			}
		},
	}),
};
