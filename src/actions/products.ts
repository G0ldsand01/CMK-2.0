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
  getProductsByCategory: defineAction({
    input: z.object({
      category: z.string(),
    }),
    handler: async (input) => {
      const products = await db.query.productsTable.findMany({
        where: eq(productsTable.category, input.category),
      });
      return products;
    },
  }),
  getProductsBySearch: defineAction({
    input: z.object({
      search: z.string(),
    }),
    handler: async (input) => {
      const products = await db.query.productsTable.findMany({
        where: eq(productsTable.name, input.search),
      });
      return products;
    },
  }),
  
  getHighestId: defineAction({
    handler: async () => {
      const [highestId] = await db.query.productsTable.findMany({
        select: { id: true },
      });

      return highestId?.id || 0;
    },
  }),
  addProduct: defineAction({ // Renamed from addProducts to addProduct
    input: z.object({
      name: z.string(),
      price: z.number(),
      description: z.string(),
      image: z.string(),
      category: z.string(),
      stock: z.number(),
      id: z.number(),
    }),
    handler: async (input) => {
      const newProduct = {
        name: input.name,
        price: input.price.toString(),
        description: input.description,
        image: input.image,
        category: input.category,
        stock: input.stock,
        id: input.id,
        rating: "0", // Default value for rating
        reviews: "0", // Default value for reviews
      };

      await db.insert(productsTable).values(newProduct);

      return newProduct;
    },
  }),
};
