import { ActionError, defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import { authServer } from '@/lib/auth-server';
import {
	addToUserWishlist,
	getUserWishlist,
	removeFromUserWishlist,
	setUserDetails,
} from '@/lib/user-manager';
import { containsDangerousPattern, logSecurityEvent } from './index';

const sanitizeString = (str: string) => str.trim().replace(/[<>]/g, '');
const sanitizeEmail = (email: string) => email.toLowerCase().trim();
const sanitizePhone = (phone: string) => phone.replace(/[^\d+()-]/g, '');
const sanitizeZip = (zip: string) => zip.replace(/[^\dA-Za-z-]/g, '');

export const user = {
	setUserDetails: defineAction({
		input: z.object({
			displayName: z
				.string()
				.min(2, 'Display name must be at least 2 characters')
				.max(50, 'Display name must be less than 50 characters')
				.transform(sanitizeString)
				.refine((str) => !containsDangerousPattern(str), {
					message: 'Display name contains invalid characters',
				}),
			firstName: z
				.string()
				.min(2, 'First name must be at least 2 characters')
				.max(50, 'First name must be less than 50 characters')
				.transform(sanitizeString)
				.refine((str) => !containsDangerousPattern(str), {
					message: 'First name contains invalid characters',
				}),
			lastName: z
				.string()
				.min(2, 'Last name must be at least 2 characters')
				.max(50, 'Last name must be less than 50 characters')
				.transform(sanitizeString)
				.refine((str) => !containsDangerousPattern(str), {
					message: 'Last name contains invalid characters',
				}),
			phone: z
				.string()
				.min(10, 'Phone number must be at least 10 digits')
				.max(20, 'Phone number must be less than 20 characters')
				.transform(sanitizePhone),
			address: z
				.string()
				.min(5, 'Address must be at least 5 characters')
				.max(200, 'Address must be less than 200 characters')
				.transform(sanitizeString)
				.refine((str) => !containsDangerousPattern(str), {
					message: 'Address contains invalid characters',
				}),
			city: z
				.string()
				.min(2, 'City must be at least 2 characters')
				.max(100, 'City must be less than 100 characters')
				.transform(sanitizeString)
				.refine((str) => !containsDangerousPattern(str), {
					message: 'City contains invalid characters',
				}),
			state: z
				.string()
				.min(2, 'State must be at least 2 characters')
				.max(100, 'State must be less than 100 characters')
				.transform(sanitizeString)
				.refine((str) => !containsDangerousPattern(str), {
					message: 'State contains invalid characters',
				}),
			zip: z
				.string()
				.min(5, 'ZIP code must be at least 5 characters')
				.max(10, 'ZIP code must be less than 10 characters')
				.transform(sanitizeZip),
			country: z
				.string()
				.min(2, 'Country must be at least 2 characters')
				.max(100, 'Country must be less than 100 characters')
				.transform(sanitizeString)
				.refine((str) => !containsDangerousPattern(str), {
					message: 'Country contains invalid characters',
				}),
			email: z
				.string()
				.email('Invalid email format')
				.transform(sanitizeEmail)
				.refine((str) => !containsDangerousPattern(str), {
					message: 'Email contains invalid characters',
				}),
		}),
		handler: async (input, context) => {
			try {
				const session = await authServer.api.getSession({
					headers: context.request.headers,
				});

				const user = session?.user;

				if (!user) {
					logSecurityEvent('UNAUTHORIZED_ACCESS', 'anonymous', {
						ip: context.request.headers.get('x-forwarded-for'),
					});
					throw new ActionError({
						code: 'UNAUTHORIZED',
						message: 'User must be logged in.',
					});
				}

				const existingId = user.id;

				const {
					displayName,
					firstName,
					lastName,
					phone,
					address,
					city,
					state,
					zip,
					country,
				} = input;

				logSecurityEvent('USER_DETAILS_UPDATE', existingId, {
					fields: [
						'displayName',
						'firstName',
						'lastName',
						'phone',
						'address',
						'city',
						'state',
						'zip',
						'country',
						'email',
					],
				});

				await setUserDetails(existingId, {
					name: displayName,
					firstName,
					lastName,
					phone,
					address,
					city,
					state,
					zip,
					country,
				});

				return {
					success: true,
					message: 'User details updated successfully',
				};
			} catch (error) {
				console.error(error);
				if (error instanceof ActionError) {
					throw error;
				}
				logSecurityEvent('UNEXPECTED_ERROR', 'unknown', {
					error: error instanceof Error ? error.message : 'Unknown error',
					ip: context?.request?.headers?.get('x-forwarded-for'),
				});
				throw new ActionError({
					code: 'INTERNAL_SERVER_ERROR',
					message: 'An unexpected error occurred',
				});
			}
		},
	}),
	getWishlist: defineAction({
		handler: async (_input, context) => {
			try {
				const session = await authServer.api.getSession({
					headers: context.request.headers,
				});

				const user = session?.user;

				if (!user) {
					logSecurityEvent('UNAUTHORIZED_ACCESS', 'anonymous', {
						ip: context.request.headers.get('x-forwarded-for'),
					});
					throw new ActionError({
						code: 'UNAUTHORIZED',
						message: 'User must be logged in.',
					});
				}

				const wishlist = await getUserWishlist(user.id);

				return {
					success: true,
					wishlist: wishlist,
				};
			} catch (error) {
				console.error(error);
				if (error instanceof ActionError) {
					throw error;
				}
				logSecurityEvent('UNEXPECTED_ERROR', 'unknown', {
					error: error instanceof Error ? error.message : 'Unknown error',
					ip: context?.request?.headers?.get('x-forwarded-for'),
				});
				throw new ActionError({
					code: 'INTERNAL_SERVER_ERROR',
					message: 'An unexpected error occurred',
				});
			}
		},
	}),
	toggleProductFromWishlist: defineAction({
		input: z.object({
			productId: z.string(),
		}),
		handler: async (input, context) => {
			try {
				const session = await authServer.api.getSession({
					headers: context.request.headers,
				});

				const user = session?.user;

				if (!user) {
					logSecurityEvent('UNAUTHORIZED_ACCESS', 'anonymous', {
						ip: context.request.headers.get('x-forwarded-for'),
					});
					throw new ActionError({
						code: 'UNAUTHORIZED',
						message: 'User must be logged in.',
					});
				}

				const { productId } = input;

				const existingWishlist = await getUserWishlist(user.id);

				if (
					existingWishlist.some(
						(wish: {
							products: { id: number };
							wishlist: { productId: number };
						}) => wish.products.id === Number(productId),
					)
				) {
					await removeFromUserWishlist(user.id, Number(productId));

					return {
						success: true,
						message: 'Product removed from wishlist successfully',
						inWishlist: false,
						wishlist: existingWishlist.filter(
							(wish) => wish.products.id !== Number(productId),
						),
					};
				}

				await addToUserWishlist(user.id, Number(productId));

				const newWishlist = [
					...existingWishlist.map((wish) => wish.products.id),
					Number(productId),
				];

				return {
					success: true,
					message: 'Product added to wishlist successfully',
					inWishlist: true,
					wishlist: newWishlist,
				};
			} catch (error) {
				console.error(error);
				if (error instanceof ActionError) {
					throw error;
				}
				logSecurityEvent('UNEXPECTED_ERROR', 'unknown', {
					error: error instanceof Error ? error.message : 'Unknown error',
					ip: context?.request?.headers?.get('x-forwarded-for'),
				});
				throw new ActionError({
					code: 'INTERNAL_SERVER_ERROR',
					message: 'An unexpected error occurred',
				});
			}
		},
	}),
};
