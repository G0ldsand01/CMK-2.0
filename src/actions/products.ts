import db from '@/lib/db';
import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import { productsTable } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const products = {
  getBestProducts: defineAction({
    handler: async () => {
      const products = await db.query.productsTable.findMany({
        limit: 8,
      });
      console.log(products);
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

      return product;
    },
  }),
};
