import { db, Product } from 'astro:db';

// https://astro.build/db/seed
export default async function seed() {
  await db.insert(Product).values({
    id: 1,
    name: 'Product 1',
    price: 100,
    description: 'Product 1 description',
    rating: 4.5,
    reviews: 100,
    image: 'https://via.placeholder.com/150',
  });
}
