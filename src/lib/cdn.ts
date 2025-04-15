import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { CDN_URL } from 'astro:env/client';
import { CDN_SECRET } from 'astro:env/server';
import axios from 'axios';
import FormData from 'form-data';

export interface CDNResponse {
	success: boolean;
	url?: string;
	message?: string;
	error?: string;
}

export async function uploadToCDN(imageBase64: string): Promise<CDNResponse> {
	const timestamp = Date.now();
	const randomString = Math.random().toString(36).substring(2, 15);
	const fileExtension = imageBase64.split(';')[0].split('/')[1];
	const uniqueFilename = `product-${timestamp}-${randomString}.${fileExtension}`;

	const base64Data = imageBase64.split(',')[1];
	const binaryData = Buffer.from(base64Data, 'base64');

	const tempDir = os.tmpdir();
	const tempFilePath = path.join(tempDir, uniqueFilename);
	fs.writeFileSync(tempFilePath, binaryData);

	try {
		const formData = new FormData();
		formData.append('uploadfile', fs.createReadStream(tempFilePath), {
			filename: uniqueFilename,
			contentType: `image/${fileExtension}`,
		});

		const headers = {
			...formData.getHeaders(),
			Authorization: `Bearer ${CDN_SECRET}`,
		};

		const response = await axios.post(`${CDN_URL}/upload/`, formData, {
			headers,
			maxContentLength: Number.POSITIVE_INFINITY,
			maxBodyLength: Number.POSITIVE_INFINITY,
		});

		const responseData = response.data as CDNResponse;

		if (!responseData.success) {
			throw new Error(responseData.message || 'Failed to upload image to CDN');
		}

		if (!responseData.url) {
			throw new Error('No image URL returned from CDN');
		}

		return responseData;
	} catch (error) {
		console.error('Error uploading to CDN:', error);

		if (error && typeof error === 'object' && 'response' in error) {
			const axiosError = error as {
				response?: { data?: { message?: string } };
			};
			return {
				success: false,
				error:
					axiosError.response?.data?.message || 'Failed to upload image to CDN',
			};
		}
		return {
			success: false,
			error:
				error instanceof Error
					? error.message
					: 'Failed to upload image to CDN',
		};
	} finally {
		// Clean up the temporary file
		try {
			fs.unlinkSync(tempFilePath);
		} catch (err) {
			console.error('Error deleting temporary file:', err);
		}
	}
}
