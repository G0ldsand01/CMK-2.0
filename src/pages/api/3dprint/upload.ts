import type { APIRoute } from 'astro';
import { upload3DFileToCDN } from '@/lib/cdn';

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

		// Convert File to Buffer
		const arrayBuffer = await file.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);

		// Upload to CDN
		const result = await upload3DFileToCDN(buffer, file.name);

		if (!result.success || !result.url) {
			console.error('CDN upload failed:', result.error);
			return new Response(
				JSON.stringify({
					error: result.error || 'Failed to upload file to CDN',
					details: 'Please check your CDN configuration and try again.',
				}),
				{ status: 500, headers: { 'Content-Type': 'application/json' } },
			);
		}

		return new Response(
			JSON.stringify({
				success: true,
				url: result.url,
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
