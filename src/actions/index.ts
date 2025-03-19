import { ActionError, defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { app } from '../firebase/server';
import { products } from '../lib/products';

const db = getFirestore(app);

export const server = {
  products,
  addProductToCart: defineAction({
    input: z.object({
      id: z.string(),
    }),
    handler: async (input, ctx) => {
      try {
        const auth = getAuth(app);
        const sessionCookie = ctx.cookies.get('__session')?.value;

        if (!sessionCookie) {
          throw new ActionError({
            code: 'UNAUTHORIZED',
            message: 'Need to be logged in',
          });
        }

        const decodedCookie = await auth.verifySessionCookie(sessionCookie);

        if (!decodedCookie) {
          throw new ActionError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Need to be logged in',
          });
        }

        const user = await auth.getUser(decodedCookie.uid);

        if (!user) {
          throw new ActionError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Need to be logged in',
          });
        }

        const product = products.find((p) => p.id.toString() === input.id);
        if (!product) {
          throw new ActionError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Something went wrong',
          });
        }

        // Firestore Logic
        const userRef = db.collection('users').doc(user.uid);
        const userDoc = await userRef.get();

        let cart = [];
        if (userDoc.exists) {
          cart = userDoc.data()!.cart || [];
        }

        // Add product ID to the cart
        cart.push(product.id);

        await userRef.set({ cart }, { merge: true });

        return 200;
      } catch (error) {
        console.error(error);
        throw new ActionError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Something went wrong',
        });
      }
    },
  }),
  getCart: defineAction({
    handler: async (input, ctx) => {
      try {
        const auth = getAuth(app);
        const sessionCookie = ctx.cookies.get('__session')?.value;

        if (!sessionCookie) {
          throw new ActionError({
            code: 'UNAUTHORIZED',
            message: 'Need to be logged in',
          });
        }

        const decodedCookie = await auth.verifySessionCookie(sessionCookie);

        if (!decodedCookie) {
          throw new ActionError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Need to be logged in',
          });
        }

        const user = await auth.getUser(decodedCookie.uid);

        if (!user) {
          throw new ActionError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Need to be logged in',
          });
        }

        const userRef = db.collection('users').doc(user.uid);
        const userDoc = await userRef.get();

        let cart = [];
        if (userDoc.exists) {
          cart = userDoc.data()!.cart || [];
        }

        const detailedCart = cart.map((id: number) =>
          products.find((p) => p.id === id)
        );

        return JSON.stringify(detailedCart);
      } catch (error) {
        console.error(error);
        throw new ActionError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Something went wrong',
        });
      }
    },
  }),
  removeFromCart: defineAction({
    input: z.object({
      id: z.string(),
    }),
    handler: async (input, ctx) => {
      try {
        const auth = getAuth(app);
        const sessionCookie = ctx.cookies.get('__session')?.value;

        if (!sessionCookie) {
          throw new ActionError({
            code: 'UNAUTHORIZED',
            message: 'Need to be logged in',
          });
        }

        const decodedCookie = await auth.verifySessionCookie(sessionCookie);

        if (!decodedCookie) {
          throw new ActionError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Need to be logged in',
          });
        }

        const user = await auth.getUser(decodedCookie.uid);

        if (!user) {
          throw new ActionError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Need to be logged in',
          });
        }

        const product = products.find((p) => p.id.toString() === input.id);
        if (!product) {
          throw new ActionError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Something went wrong',
          });
        }

        // Firestore Logic
        const userRef = db.collection('users').doc(user.uid);
        const userDoc = await userRef.get();

        let cart = [];
        if (userDoc.exists) {
          cart = userDoc.data()!.cart || [];
        }

        // Remove product ID from the cart
        cart = cart.filter((id: number) => id !== product.id);

        await userRef.set({ cart }, { merge: true });

        return 200;
      } catch (error) {
        console.error(error);
        throw new ActionError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Something went wrong',
        });
      }
    },
  }),
};
