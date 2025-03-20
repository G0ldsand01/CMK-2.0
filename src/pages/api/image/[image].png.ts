import type { APIRoute } from 'astro';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export const GET: APIRoute = async ({ params }) => {
  const name = params.image;
  const imagePath = join(
    process.cwd(),
    'src',
    'assets',
    'images',
    `${name}.png`
  );
  const image = await readFile(imagePath);
  return new Response(image, {
    headers: {
      'Content-Type': 'image/png',
    },
  });
};
