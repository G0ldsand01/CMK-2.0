import type { APIRoute } from 'astro';
import fs from 'node:fs';
import path from 'node:path';

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
		const uniqueFilename = `3dprint-${timestamp}-${randomString}.${fileExtension}`;

		// Convertir le fichier en buffer
		const arrayBuffer = await file.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);

		// Vérifier si on est sur Vercel (avec Blob Storage) ou en local
		const blobToken =
			import.meta.env.BLOB_READ_WRITE_TOKEN ||
			process.env.BLOB_READ_WRITE_TOKEN;

		if (blobToken) {
			// Utiliser Vercel Blob Storage si le token est disponible
			try {
				const { put } = await import('@vercel/blob');
				const blob = await put(`3dprint/${uniqueFilename}`, buffer, {
					access: 'public',
					contentType: file.type || 'application/octet-stream',
					token: blobToken,
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
			} catch (blobError) {
				console.warn(
					'⚠️ Vercel Blob upload failed, falling back to local storage:',
					blobError,
				);
				// Continue avec le stockage local en cas d'erreur
			}
		}

		// Stockage local (pour localhost et fallback)
		const uploadDir = path.join(process.cwd(), 'public', 'uploads', '3dprint');
		if (!fs.existsSync(uploadDir)) {
			fs.mkdirSync(uploadDir, { recursive: true });
		}

		const filePath = path.join(uploadDir, uniqueFilename);
		fs.writeFileSync(filePath, buffer);

		console.log(
			'✅ File uploaded locally:',
			uniqueFilename,
			'Size:',
			file.size,
			'bytes',
		);

		// Construire l'URL relative (accessible via le serveur Astro)
		const fileUrl = `/uploads/3dprint/${uniqueFilename}`;

		return new Response(
			JSON.stringify({
				success: true,
				url: fileUrl,
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
