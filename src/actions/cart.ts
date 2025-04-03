import { getUser } from '@/lib/user';
import { ActionError, defineAction } from 'astro:actions';
import { z } from 'astro:content';
import { logSecurityEvent } from './index';
import db from '@/lib/db';
import { cartTable, productsTable } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const cart = {
  addProductIdToCart: defineAction({
    input: z.object({
      productId: z.string(),
    }),
    handler: async (input, context) => {
      const user = await getUser(context.request);

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
        .select()
        .from(cartTable)
        .where(eq(cartTable.userId, user.getId()))
        .innerJoin(productsTable, eq(cartTable.productId, productsTable.id));

      if (cart.some((item) => item.products.id === Number(productId))) {
        return {
          success: false,
          cart: cart,
        };
      }

      await db
        .insert(cartTable)
        .values({
          userId: user.getId(),
          productId: Number(productId),
          quantity: 1,
        })
        .onConflictDoNothing()
        .returning();

      const newCart = await db
        .select()
        .from(cartTable)
        .where(eq(cartTable.userId, user.getId()))
        .innerJoin(productsTable, eq(cartTable.productId, productsTable.id));

      return {
        success: true,
        cart: newCart,
      };
    },
  }),
};
