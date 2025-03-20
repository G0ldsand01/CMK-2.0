import { Product } from '@lloydjatkinson/astro-snipcart/astro';
import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import { getFirestore } from 'firebase-admin/firestore';
import { app } from '@/firebase/server';

const db = getFirestore(app);

export const products = {
  getBestProducts: defineAction({
    handler: async () => {
      const products = await db.collection('products').limit(8).get();
      return products.docs.map((doc) => doc.data());
    },
  }),
  getProductById: defineAction({
    input: z.object({
      id: z.number(),
    }),
    handler: async (input, ctx) => {
      const product = await db
        .collection('products')
        .doc(String(input.id))
        .get();
      return product.data();
    },
  }),
};
