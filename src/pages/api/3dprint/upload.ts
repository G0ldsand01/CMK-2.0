import type { APIRoute } from 'astro';
import { put } from '@vercel/blob';

export const POST: APIRoute = async ({ request }) => {
	try {
		const formData = await request.formData();
		const file = formData.get('file') as File;

		if (!file) {
			return new Response(JSON.stringify({ error: 'No file provided' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		// Check file size (max 50MB)
		const maxSize = 50 * 1024 * 1024; // 50MB
		if (file.size > maxSize) {
			return new Response(
				JSON.stringify({ error: 'File size exceeds 50MB limit' }),
				{ status: 400, headers: { 'Content-Type': 'application/json' } },
			);
		}

		// Générer un nom de fichier unique
		const timestamp = Date.now();
		const randomString = Math.random().toString(36).substring(2, 15);
		const fileExtension = file.name.split('.').pop() || 'stl';
		const uniqueFilename = `3dprint/${timestamp}-${randomString}.${fileExtension}`;

		// Convertir le fichier en buffer
		const arrayBuffer = await file.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);

		// Upload vers Vercel Blob Storage
		const blob = await put(uniqueFilename, buffer, {
			access: 'public',
			contentType: file.type || 'application/octet-stream',
		});

		console.log(
			'✅ File uploaded to Vercel Blob:',
			uniqueFilename,
			'Size:',
			file.size,
			'bytes',
		);

		return new Response(
			JSON.stringify({
				success: true,
				url: blob.url,
				filename: file.name,
			}),
			{ status: 200, headers: { 'Content-Type': 'application/json' } },
		);
	} catch (err) {
		console.error('❌ File upload error:', err);
		return new Response(
			JSON.stringify({
				error: err instanceof Error ? err.message : 'Internal server error',
			}),
			{ status: 500, headers: { 'Content-Type': 'application/json' } },
		);
	}
};
