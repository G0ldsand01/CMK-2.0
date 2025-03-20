import { app } from '@/firebase/server';
import type { APIRoute } from 'astro';
import { getFirestore } from 'firebase-admin/firestore';

const db = getFirestore(app);

export const GET: APIRoute = async ({ redirect, cookies }) => {
  let product = await db.collection('products').get();

  if (!product) {
    return new Response(JSON.stringify({ error: 'No product found' }), {
      status: 404,
    });
  }

  if (product.empty) {
    const seeding = [
      {
        id: 1,
        name: 'Mouse',
        price: 100,
        image: 'mouse',
        description: 'A high-quality mouse',
        rating: 4.5,
        reviews: 150,
      },
      {
        id: 2,
        name: 'Keyboard',
        price: 50,
        image: 'keyboard',
        description: 'A high-quality keyboard',
        rating: 4.5,
        reviews: 150,
      },
      {
        id: 3,
        name: 'Headset',
        price: 300,
        image: 'headset',
        description: 'A high-quality headset',
        rating: 4.5,
        reviews: 150,
      },
      {
        id: 4,
        name: 'Mouse',
        price: 100,
        image: 'mouse',
        description: 'A high-quality mouse',
        rating: 4.5,
        reviews: 150,
      },
      {
        id: 5,
        name: 'Keyboard',
        price: 50,
        image: 'keyboard',
        description: 'A high-quality keyboard',
        rating: 4.5,
        reviews: 150,
      },
      {
        id: 6,
        name: 'Headset',
        price: 300,
        image: 'headset',
        description: 'A high-quality headset',
        rating: 4.5,
        reviews: 150,
      },
      {
        id: 7,
        name: 'Mouse',
        price: 100,
        image: 'mouse',
        description: 'A high-quality mouse',
        rating: 4.5,
        reviews: 150,
      },
      {
        id: 8,
        name: 'Keyboard',
        price: 50,
        image: 'keyboard',
        description: 'A high-quality keyboard',
        rating: 4.5,
        reviews: 150,
      },
      {
        id: 9,
        name: 'Headset',
        price: 300,
        image: 'headset',
        description: 'A high-quality headset',
        rating: 4.5,
        reviews: 150,
      },
    ];
    for (const product of seeding) {
      await db.collection('products').add(product);
    }

    product = await db.collection('products').get();
  }

  return new Response(JSON.stringify(product.docs.map((doc) => doc.data())), {
    status: 200,
  });
};
