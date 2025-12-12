import { ActionError, defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import { eq, like, or, desc, asc, count, inArray } from 'drizzle-orm';
import { user, account } from '@/db/schema';
import { authServer } from '@/lib/auth-server';
import db from '@/lib/db';
import { logSecurityEvent } from '../index';
import * as bcrypt from 'bcryptjs';

export const users = {
	getUsers: defineAction({
		input: z.object({
			limit: z.number().optional().default(50),
			offset: z.number().optional().default(0),
			search: z.string().optional(),
			sortBy: z
				.enum(['name', 'email', 'role', 'createdAt'])
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
				const searchTerm = input.search ? `%${input.search}%` : null;
				const whereCondition = searchTerm
					? or(
							like(user.name, searchTerm),
							like(user.email, searchTerm),
							like(user.firstName || '', searchTerm),
							like(user.lastName || '', searchTerm),
						)
					: undefined;

				// Get total count
				const totalResult = whereCondition
					? await db.select({ count: count() }).from(user).where(whereCondition)
					: await db.select({ count: count() }).from(user);

				const total = totalResult[0]?.count || 0;

				// Apply sorting
				const sortColumn =
					input.sortBy === 'createdAt'
						? user.createdAt
						: input.sortBy === 'name'
							? user.name
							: input.sortBy === 'email'
								? user.email
								: user.role;

				// Build query with filters, sorting, and pagination
				let query = db.select().from(user);
				if (whereCondition) {
					query = query.where(whereCondition) as any;
				}
				if (input.sortOrder === 'asc') {
					query = query.orderBy(asc(sortColumn)) as any;
				} else {
					query = query.orderBy(desc(sortColumn)) as any;
				}

				// Apply pagination
				const users = await query.limit(input.limit).offset(input.offset);

				// Get account info (to check if user has password)
				const userIds = users.map((u) => u.id);
				const accounts =
					userIds.length > 0
						? await db
								.select()
								.from(account)
								.where(inArray(account.userId, userIds))
						: [];

				const usersWithAccountInfo = users.map((u) => {
					const userAccount = accounts.find((a) => a.userId === u.id);
					// Clean up image - remove if null, undefined, empty string, or invalid
					let cleanImage: string | null = null;
					if (u.image && typeof u.image === 'string') {
						const trimmed = u.image.trim();
						// Only keep image if it's a valid non-empty string that's not a placeholder
						if (
							trimmed !== '' &&
							trimmed !== 'null' &&
							trimmed !== 'undefined' &&
							trimmed.length > 0 &&
							!trimmed.startsWith('data:image/svg') // Exclude SVG data URLs that might be placeholders
						) {
							// Additional validation: check if it looks like a valid URL
							try {
								// If it's a URL, validate it
								if (
									trimmed.startsWith('http://') ||
									trimmed.startsWith('https://')
								) {
									const url = new URL(trimmed);
									// Only keep if it's a valid URL
									cleanImage = trimmed;
								} else if (trimmed.startsWith('data:image/')) {
									// Allow data URLs for images (but not SVG)
									cleanImage = trimmed;
								}
							} catch {
								// Invalid URL, don't set cleanImage
								cleanImage = null;
							}
						}
					}
					return {
						...u,
						image: cleanImage,
						hasPassword: !!userAccount?.password,
						providerId: userAccount?.providerId || null,
					};
				});

				return {
					data: usersWithAccountInfo,
					total,
				};
			} catch (error) {
				console.error('Error fetching users:', error);
				throw new ActionError({
					code: 'INTERNAL_ERROR',
					message: 'Failed to fetch users',
				});
			}
		},
	}),

	updateUser: defineAction({
		input: z.object({
			userId: z.string(),
			name: z.string().min(1).optional(),
			email: z.string().email().optional(),
			firstName: z.string().optional(),
			lastName: z.string().optional(),
			phone: z.string().optional(),
			address: z.string().optional(),
			city: z.string().optional(),
			state: z.string().optional(),
			zip: z.string().optional(),
			country: z.string().optional(),
			role: z.enum(['user', 'admin']).optional(),
			emailVerified: z.boolean().optional(),
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
				const updateData: any = {};
				if (input.name !== undefined) updateData.name = input.name;
				if (input.email !== undefined) updateData.email = input.email;
				if (input.firstName !== undefined)
					updateData.firstName = input.firstName;
				if (input.lastName !== undefined) updateData.lastName = input.lastName;
				if (input.phone !== undefined) updateData.phone = input.phone;
				if (input.address !== undefined) updateData.address = input.address;
				if (input.city !== undefined) updateData.city = input.city;
				if (input.state !== undefined) updateData.state = input.state;
				if (input.zip !== undefined) updateData.zip = input.zip;
				if (input.country !== undefined) updateData.country = input.country;
				if (input.role !== undefined) updateData.role = input.role;
				if (input.emailVerified !== undefined)
					updateData.emailVerified = input.emailVerified;

				await db.update(user).set(updateData).where(eq(user.id, input.userId));

				await logSecurityEvent(
					'USER_UPDATE',
					currentUser.id,
					{
						targetUserId: input.userId,
						fields: Object.keys(updateData),
					},
					context.request.headers.get('x-forwarded-for'),
					context.request.headers.get('user-agent'),
				);

				return {
					success: true,
					message: 'User updated successfully',
				};
			} catch (error) {
				console.error('Error updating user:', error);
				throw new ActionError({
					code: 'INTERNAL_ERROR',
					message: 'Failed to update user',
				});
			}
		},
	}),

	resetPassword: defineAction({
		input: z.object({
			userId: z.string(),
			newPassword: z.string().min(8, 'Password must be at least 8 characters'),
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
				// Hash the new password
				const hashedPassword = await bcrypt.hash(input.newPassword, 10);

				// Find the user's account
				const userAccounts = await db
					.select()
					.from(account)
					.where(eq(account.userId, input.userId));

				if (userAccounts.length === 0) {
					// Create a new account entry if it doesn't exist
					await db.insert(account).values({
						id: crypto.randomUUID(),
						accountId: input.userId,
						providerId: 'credential',
						userId: input.userId,
						password: hashedPassword,
					});
				} else {
					// Update existing account
					await db
						.update(account)
						.set({ password: hashedPassword })
						.where(eq(account.userId, input.userId));
				}

				await logSecurityEvent(
					'PASSWORD_RESET',
					currentUser.id,
					{
						targetUserId: input.userId,
					},
					context.request.headers.get('x-forwarded-for'),
					context.request.headers.get('user-agent'),
				);

				return {
					success: true,
					message: 'Password reset successfully',
				};
			} catch (error) {
				console.error('Error resetting password:', error);
				throw new ActionError({
					code: 'INTERNAL_ERROR',
					message: 'Failed to reset password',
				});
			}
		},
	}),

	deleteUser: defineAction({
		input: z.object({
			userId: z.string(),
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

			// Prevent deleting yourself
			if (input.userId === currentUser.id) {
				throw new ActionError({
					code: 'INVALID_INPUT',
					message: 'You cannot delete your own account',
				});
			}

			try {
				// Delete user (cascade will handle related records)
				await db.delete(user).where(eq(user.id, input.userId));

				await logSecurityEvent(
					'USER_DELETE',
					currentUser.id,
					{
						targetUserId: input.userId,
					},
					context.request.headers.get('x-forwarded-for'),
					context.request.headers.get('user-agent'),
				);

				return {
					success: true,
					message: 'User deleted successfully',
				};
			} catch (error) {
				console.error('Error deleting user:', error);
				throw new ActionError({
					code: 'INTERNAL_ERROR',
					message: 'Failed to delete user',
				});
			}
		},
	}),
};
