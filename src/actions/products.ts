import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import { db, desc, eq, Product } from 'astro:db';

export const products = {
  getBestProducts: defineAction({
    handler: async () => {
      const product = await db
        .select()
        .from(Product)
        .orderBy(desc(Product.rating))
        .limit(8);
      return product;
    },
  }),
  getProductById: defineAction({
    input: z.object({
      id: z.number(),
    }),
    handler: async (input, ctx) => {
      const [product] = await db
        .select()
        .from(Product)
        .where(eq(Product.id, input.id));
      return product;
    },
  }),
};
