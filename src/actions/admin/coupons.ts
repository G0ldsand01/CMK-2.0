import { ActionError, defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import { authServer } from '@/lib/auth-server';
import { stripe } from '@/lib/stripe';
import { logSecurityEvent } from '../index';

export const coupons = {
	getCoupons: defineAction({
		input: z.object({
			limit: z.number().optional().default(100),
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
				const coupons = await stripe.coupons.list({
					limit: input.limit,
				});

				const formattedCoupons = coupons.data.map((coupon) => ({
					id: coupon.id,
					name: coupon.name || coupon.id,
					code: coupon.id, // In Stripe, the coupon ID is the code
					percentOff: coupon.percent_off,
					amountOff: coupon.amount_off ? coupon.amount_off / 100 : null,
					currency: coupon.currency || null,
					duration: coupon.duration,
					durationInMonths: coupon.duration_in_months,
					maxRedemptions: coupon.max_redemptions,
					timesRedeemed: coupon.times_redeemed,
					valid: coupon.valid,
					created: new Date(coupon.created * 1000),
					redeemBy: coupon.redeem_by ? new Date(coupon.redeem_by * 1000) : null,
					metadata: coupon.metadata,
				}));

				return {
					data: formattedCoupons,
					hasMore: coupons.has_more,
				};
			} catch (error) {
				console.error('Error fetching coupons:', error);
				throw new ActionError({
					code: 'INTERNAL_ERROR',
					message: 'Failed to fetch coupons',
				});
			}
		},
	}),

	createCoupon: defineAction({
		input: z.object({
			id: z.string().min(1).max(50), // Coupon code/ID
			name: z.string().optional(),
			percentOff: z.number().min(0).max(100).optional(),
			amountOff: z.number().min(0).optional(), // Amount in dollars/cents
			currency: z.string().length(3).optional(),
			duration: z
				.enum(['once', 'forever', 'repeating'])
				.optional()
				.default('once'),
			durationInMonths: z.number().min(1).max(12).optional(),
			maxRedemptions: z.number().min(1).optional(),
			redeemBy: z.string().optional(), // ISO date string
			metadata: z.record(z.string()).optional(),
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

			// Validate that either percentOff or amountOff is provided
			if (!input.percentOff && !input.amountOff) {
				throw new ActionError({
					code: 'VALIDATION_ERROR',
					message: 'Either percentOff or amountOff must be provided',
				});
			}

			// If amountOff is provided, currency is required
			if (input.amountOff && !input.currency) {
				throw new ActionError({
					code: 'VALIDATION_ERROR',
					message: 'Currency is required when amountOff is provided',
				});
			}

			// If duration is repeating, durationInMonths is required
			if (input.duration === 'repeating' && !input.durationInMonths) {
				throw new ActionError({
					code: 'VALIDATION_ERROR',
					message: 'durationInMonths is required when duration is repeating',
				});
			}

			try {
				const couponParams: any = {
					id: input.id,
					name: input.name,
					duration: input.duration,
				};

				if (input.percentOff !== undefined) {
					couponParams.percent_off = input.percentOff;
				} else if (input.amountOff !== undefined) {
					couponParams.amount_off = Math.round(input.amountOff * 100); // Convert to cents
					couponParams.currency = input.currency?.toLowerCase();
				}

				if (input.duration === 'repeating' && input.durationInMonths) {
					couponParams.duration_in_months = input.durationInMonths;
				}

				if (input.maxRedemptions) {
					couponParams.max_redemptions = input.maxRedemptions;
				}

				if (input.redeemBy) {
					couponParams.redeem_by = Math.floor(
						new Date(input.redeemBy).getTime() / 1000,
					);
				}

				if (input.metadata) {
					couponParams.metadata = input.metadata;
				}

				const coupon = await stripe.coupons.create(couponParams);

				logSecurityEvent('COUPON_CREATED', currentUser.id, {
					couponId: coupon.id,
				});

				return {
					success: true,
					coupon: {
						id: coupon.id,
						name: coupon.name || coupon.id,
						code: coupon.id,
						percentOff: coupon.percent_off,
						amountOff: coupon.amount_off ? coupon.amount_off / 100 : null,
						currency: coupon.currency || null,
						duration: coupon.duration,
						durationInMonths: coupon.duration_in_months,
						maxRedemptions: coupon.max_redemptions,
						timesRedeemed: coupon.times_redeemed,
						valid: coupon.valid,
						created: new Date(coupon.created * 1000),
						redeemBy: coupon.redeem_by
							? new Date(coupon.redeem_by * 1000)
							: null,
					},
				};
			} catch (error: any) {
				console.error('Error creating coupon:', error);
				throw new ActionError({
					code: 'INTERNAL_ERROR',
					message: error.message || 'Failed to create coupon',
				});
			}
		},
	}),

	deleteCoupon: defineAction({
		input: z.object({
			couponId: z.string(),
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
				await stripe.coupons.del(input.couponId);

				logSecurityEvent('COUPON_DELETED', currentUser.id, {
					couponId: input.couponId,
				});

				return {
					success: true,
					message: 'Coupon deleted successfully',
				};
			} catch (error: any) {
				console.error('Error deleting coupon:', error);
				throw new ActionError({
					code: 'INTERNAL_ERROR',
					message: error.message || 'Failed to delete coupon',
				});
			}
		},
	}),
};
