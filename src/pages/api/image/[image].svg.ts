import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ params }) => {
	const name = params.image;
	const imagePath = join(
		process.cwd(),
		'src',
		'assets',
		'cdn',
		'icons',
		`${name}.svg`,
	);
	const image = await readFile(imagePath);
	return new Response(image, {
		headers: {
			'Content-Type': 'image/svg+xml',
		},
	});
};
