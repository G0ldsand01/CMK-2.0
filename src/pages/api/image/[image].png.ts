import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ params }) => {
	const name = params.image;

	console.log(name);

	const imagePath = join(
		process.cwd(),
		'src',
		'assets',
		'images',
		`${name}.png`,
	);

	const image = await readFile(imagePath);

	return new Response(image, {
		headers: {
			'Content-Type': 'image/png',
		},
	});
};
