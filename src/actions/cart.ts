import { ActionError, defineAction } from 'astro:actions';
import { z } from 'astro:content';
import { WEBSITE_URL } from 'astro:env/server';
import { and, eq, sql } from 'drizzle-orm';
import {
	cartTable,
	imageTable,
	ordersTable,
	productImageTable,
	productsTable,
} from '@/db/schema';
import { authServer } from '@/lib/auth-server';
import db from '@/lib/db';
import { stripe } from '@/lib/stripe';
import { logSecurityEvent } from './index';

// Helper function to load images for cart items
async function loadCartWithImages(
	cartItems: Array<{
		cart: typeof cartTable.$inferSelect;
		products: typeof productsTable.$inferSelect;
	}>,
) {
	return Promise.all(
		cartItems.map(async (item) => {
			const [firstImage] = await db
				.select({
					image: imageTable,
				})
				.from(productImageTable)
				.where(eq(productImageTable.productId, item.products.id))
				.leftJoin(imageTable, eq(productImageTable.image, imageTable.id))
				.orderBy(productImageTable.priority)
				.limit(1);

			return {
				...item,
				image: firstImage?.image?.image || null,
			};
		}),
	);
}

export const cart = {
	addProductIdToCart: defineAction({
		input: z.object({
			productId: z.string(),
		}),
		handler: async (input, context) => {
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

			const cart = await db
				.select({
					cart: cartTable,
					products: productsTable,
				})
				.from(cartTable)
				.where(eq(cartTable.userId, user.id))
				.innerJoin(productsTable, eq(cartTable.productId, productsTable.id));

			const cartWithImages = await loadCartWithImages(cart);

			if (cart.some((item) => item.products.id === Number(productId))) {
				return {
					success: false,
					cart: cartWithImages,
				};
			}

			await db
				.insert(cartTable)
				.values({
					userId: user.id,
					productId: Number(productId),
					quantity: 1,
				})
				.onConflictDoNothing()
				.returning();

			// Log cart add event
			await logSecurityEvent(
				'CART_ADD',
				user.id,
				{
					productId: Number(productId),
					action: 'add_to_cart',
				},
				context.request.headers.get('x-forwarded-for') || null,
				context.request.headers.get('user-agent') || null,
			);

			const newCart = await db
				.select({
					cart: cartTable,
					products: productsTable,
				})
				.from(cartTable)
				.where(eq(cartTable.userId, user.id))
				.innerJoin(productsTable, eq(cartTable.productId, productsTable.id));

			const newCartWithImages = await loadCartWithImages(newCart);

			return {
				success: true,
				cart: newCartWithImages,
			};
		},
	}),
	updateCartItem: defineAction({
		input: z.object({
			productId: z.string(),
			increment: z.boolean().optional(),
			decrement: z.boolean().optional(),
		}),
		handler: async (input, context) => {
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

			const { productId, increment, decrement } = input;

			return await db.transaction(async (tx) => {
				let set = {};
				let action = '';

				if (increment) {
					set = { quantity: sql`${cartTable.quantity} + 1` };
					action = 'increment';
				} else if (decrement) {
					set = { quantity: sql`${cartTable.quantity} - 1` };
					action = 'decrement';
				}

				await tx
					.update(cartTable)
					.set(set)
					.where(
						and(
							eq(cartTable.userId, user.id),
							eq(cartTable.productId, Number(productId)),
						),
					);

				// Log cart update event
				if (action) {
					await logSecurityEvent(
						'CART_UPDATE',
						user.id,
						{
							productId: Number(productId),
							action,
						},
						context.request.headers.get('x-forwarded-for') || null,
						context.request.headers.get('user-agent') || null,
					);
				}

				const cart = await tx
					.select({
						cart: cartTable,
						products: productsTable,
					})
					.from(cartTable)
					.where(eq(cartTable.userId, user.id))
					.innerJoin(productsTable, eq(cartTable.productId, productsTable.id));

				const cartWithImages = await loadCartWithImages(cart);

				return {
					success: true,
					cart: cartWithImages,
				};
			});
		},
	}),
	deleteCartItem: defineAction({
		input: z.object({
			productId: z.string(),
		}),
		handler: async (input, context) => {
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

			return await db.transaction(async (tx) => {
				await tx
					.delete(cartTable)
					.where(
						and(
							eq(cartTable.userId, user.id),
							eq(cartTable.productId, Number(productId)),
						),
					);

				// Log cart remove event
				await logSecurityEvent(
					'CART_REMOVE',
					user.id,
					{
						productId: Number(productId),
						action: 'remove_from_cart',
					},
					context.request.headers.get('x-forwarded-for') || null,
					context.request.headers.get('user-agent') || null,
				);

				const cart = await tx
					.select({
						cart: cartTable,
						products: productsTable,
					})
					.from(cartTable)
					.where(eq(cartTable.userId, user.id))
					.innerJoin(productsTable, eq(cartTable.productId, productsTable.id));

				const cartWithImages = await loadCartWithImages(cart);

				return {
					success: true,
					cart: cartWithImages,
				};
			});
		},
	}),
	checkout: defineAction({
		handler: async (_input, context) => {
			const ssession = await authServer.api.getSession({
				headers: context.request.headers,
			});

			const user = ssession?.user;

			if (!user) {
				logSecurityEvent('UNAUTHORIZED_ACCESS', 'anonymous', {
					ip: context.request.headers.get('x-forwarded-for'),
				});
				throw new ActionError({
					code: 'UNAUTHORIZED',
					message: 'User must be logged in.',
				});
			}

			const cart = await db
				.select({
					cart: cartTable,
					products: productsTable,
				})
				.from(cartTable)
				.where(eq(cartTable.userId, user.id))
				.innerJoin(productsTable, eq(cartTable.productId, productsTable.id));

			if (cart.length === 0) {
				throw new ActionError({
					code: 'BAD_REQUEST',
					message: 'Your cart is empty.',
				});
			}

			// Load images for cart items
			const cartWithImages = await loadCartWithImages(cart);

			const line_items = cartWithImages.map((item) => {
				// Get the first image URL if available
				// Use import.meta.env since CDN_URL is public and accessible on server
				const cdnUrl = import.meta.env.CDN_URL;
				const imageUrl =
					item.image && cdnUrl ? `${cdnUrl}/${item.image}` : null;

				return {
					price_data: {
						currency: 'cad',
						product_data: {
							name: item.products.name,
							description: item.products.description,
							images: imageUrl ? [imageUrl] : [],
						},
						unit_amount: Number.parseInt(item.products.price, 10) * 100,
					},
					quantity: item.cart.quantity,
				};
			});

			// Calculate total amount for metadata
			line_items.reduce((sum, item) => {
				return sum + item.price_data.unit_amount * item.quantity;
			}, 0);

			// Create order first to get the order ID
			const order = await db
				.insert(ordersTable)
				.values({
					userId: user.id,
					status: 'pending',
					cartJSON: cart,
					stripeSessionId: 'pending', // Temporary value, will be updated after session creation
				})
				.returning();

			if (!order || order.length === 0) {
				throw new ActionError({
					code: 'INTERNAL_SERVER_ERROR',
					message: 'Failed to create order.',
				});
			}

			const orderId = order[0].id;

			// Create Stripe checkout session with enhanced metadata
			const session = await stripe.checkout.sessions.create({
				payment_method_types: ['card'],
				mode: 'payment',
				line_items,
				success_url: `${WEBSITE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
				cancel_url: `${WEBSITE_URL}/cancel`,
				customer_email: user.email,
				metadata: {
					orderId: orderId.toString(),
					userId: user.id,
				},
				payment_intent_data: {
					metadata: {
						orderId: orderId.toString(),
						userId: user.id,
						sessionId: 'pending', // Will be updated after session creation
					},
				},
				shipping_address_collection: {
					allowed_countries: ['CA'],
				},
				billing_address_collection: 'required',
				allow_promotion_codes: true,
				expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // 30 minutes
			});

			// Update order with Stripe session ID
			await db
				.update(ordersTable)
				.set({ stripeSessionId: session.id })
				.where(eq(ordersTable.id, orderId));

			// Log order creation
			const totalAmount = line_items.reduce((sum, item) => {
				return sum + item.price_data.unit_amount * item.quantity;
			}, 0);

			await logSecurityEvent(
				'ORDER_CREATED',
				user.id,
				{
					orderId,
					stripeSessionId: session.id,
					totalAmount: totalAmount / 100,
					itemCount: cart.length,
				},
				context.request.headers.get('x-forwarded-for') || null,
				context.request.headers.get('user-agent') || null,
			);

			// Update payment intent metadata with the actual session ID
			try {
				if (
					session.payment_intent &&
					typeof session.payment_intent === 'string'
				) {
					await stripe.paymentIntents.update(session.payment_intent, {
						metadata: {
							orderId: orderId.toString(),
							userId: user.id,
							sessionId: session.id,
						},
					});
				}
			} catch (updateError) {
				// Non-critical error, log but don't fail
				console.warn('Failed to update payment intent metadata:', updateError);
			}

			return {
				url: session.url,
			};
		},
	}),
};
