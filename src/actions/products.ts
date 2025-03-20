import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import { getFirestore } from 'firebase-admin/firestore';
import { app } from '@/firebase/server';

const db = getFirestore(app);

export const products = {
  getBestProducts: defineAction({
    handler: async () => {
      const products = await db.collection('products').limit(8).get();
      console.log(products.docs.map((doc) => doc.data()));
      return products.docs.map((doc) => doc.data());
    },
  }),
  getProductById: defineAction({
    input: z.object({
      id: z.number(),
    }),
    handler: async (input, ctx) => {
      const products = await db.collection('products').get();
      const productsData = products.docs.map((doc) => doc.data());

      const product = productsData.find((doc) => doc.id === input.id);

      return product;
    },
  }),
};
