import type { APIRoute } from 'astro';
import { db, Product } from 'astro:db';

export const GET: APIRoute = async ({ redirect, cookies }) => {
  const product = await db.select().from(Product);
  return new Response(JSON.stringify(product), {
    status: 200,
  });
};
