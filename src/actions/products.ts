import db from '@/lib/db';
import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import { productsTable, wishlistTable } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { getSession } from 'auth-astro/server';

export const products = {
  getBestProducts: defineAction({
    handler: async () => {
      const products = await db.query.productsTable.findMany({
        limit: 8,
      });
      return products;
    },
  }),
  getProductById: defineAction({
    input: z.object({
      id: z.number(),
    }),
    handler: async (input, ctx) => {
      const products = await db.query.productsTable.findMany({
        where: eq(productsTable.id, input.id),
      });

      const product = products.find((doc) => doc.id === input.id);

      const session = await getSession(ctx.request);
      if (session && session.user && session.user.id) {
        const userId = session.user.id;
        const wishlist = await db.query.wishlistTable.findMany({
          where: and(
            eq(wishlistTable.userId, userId),
            eq(wishlistTable.productId, input.id)
          ),
        });
        return { product, isInWishlist: wishlist.length > 0 };
      }

      return { product, isInWishlist: false };
    },
  }),
};
