import { CDN_SECRET } from 'astro:env/server';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
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

		// Get CDN_URL from environment
		// In Astro with server context, use import.meta.env directly
		const CDN_URL = import.meta.env.CDN_URL as string | undefined;
		if (!CDN_URL) {
			const errorMsg =
				'CDN_URL is not configured. Please set CDN_URL in your environment variables.';
			console.error(errorMsg);
			console.error(
				'Available env vars:',
				Object.keys(import.meta.env).filter(
					(k) => k.includes('CDN') || k.includes('cdn'),
				),
			);
			throw new Error(errorMsg);
		}

		if (!CDN_SECRET) {
			const errorMsg =
				'CDN_SECRET is not configured. Please set CDN_SECRET in your environment variables.';
			console.error(errorMsg);
			throw new Error(errorMsg);
		}

		// Ensure URL doesn't end with slash and add /upload/ endpoint
		const baseUrl = CDN_URL.trim().replace(/\/+$/, '');
		const uploadUrl = `${baseUrl}/upload/`;

		console.log('Uploading file to CDN:', uploadUrl);
		const response = await axios.post(uploadUrl, formData, {
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

export async function upload3DFileToCDN(
	fileBuffer: Buffer,
	originalFilename: string,
): Promise<CDNResponse> {
	const timestamp = Date.now();
	const randomString = Math.random().toString(36).substring(2, 15);
	const fileExtension = originalFilename.split('.').pop() || 'stl';
	const uniqueFilename = `3dprint-${timestamp}-${randomString}.${fileExtension}`;

	const tempDir = os.tmpdir();
	const tempFilePath = path.join(tempDir, uniqueFilename);
	fs.writeFileSync(tempFilePath, fileBuffer);

	try {
		const formData = new FormData();
		formData.append('uploadfile', fs.createReadStream(tempFilePath), {
			filename: uniqueFilename,
			contentType: `application/octet-stream`,
		});

		const headers = {
			...formData.getHeaders(),
			Authorization: `Bearer ${CDN_SECRET}`,
		};

		// Get CDN_URL from environment
		// In Astro with server context, use import.meta.env directly
		const CDN_URL = import.meta.env.CDN_URL as string | undefined;
		if (!CDN_URL) {
			const errorMsg =
				'CDN_URL is not configured. Please set CDN_URL in your environment variables.';
			console.error(errorMsg);
			console.error(
				'Available env vars:',
				Object.keys(import.meta.env).filter(
					(k) => k.includes('CDN') || k.includes('cdn'),
				),
			);
			throw new Error(errorMsg);
		}

		if (!CDN_SECRET) {
			const errorMsg =
				'CDN_SECRET is not configured. Please set CDN_SECRET in your environment variables.';
			console.error(errorMsg);
			throw new Error(errorMsg);
		}

		// Ensure URL doesn't end with slash and add /upload/ endpoint
		const baseUrl = CDN_URL.trim().replace(/\/+$/, '');
		const uploadUrl = `${baseUrl}/upload/`;

		console.log('Uploading file to CDN:', uploadUrl);
		console.log('File size:', fileBuffer.length, 'bytes');
		console.log('Filename:', uniqueFilename);

		const response = await axios.post(uploadUrl, formData, {
			headers,
			maxContentLength: Number.POSITIVE_INFINITY,
			maxBodyLength: Number.POSITIVE_INFINITY,
			timeout: 60000, // 60 secondes timeout
		});

		const responseData = response.data as CDNResponse;
		console.log('CDN response:', response.status, responseData);

		if (!responseData.success) {
			const errorMsg =
				responseData.message ||
				responseData.error ||
				'Failed to upload file to CDN';
			console.error('CDN returned error:', errorMsg);
			throw new Error(errorMsg);
		}

		if (!responseData.url) {
			console.error('CDN response missing URL:', responseData);
			throw new Error('No file URL returned from CDN');
		}

		console.log('File uploaded successfully:', responseData.url);
		return responseData;
	} catch (error) {
		console.error('Error uploading 3D file to CDN:', error);

		if (error && typeof error === 'object' && 'response' in error) {
			const axiosError = error as {
				response?: {
					status?: number;
					statusText?: string;
					data?: { message?: string; error?: string };
				};
			};

			const status = axiosError.response?.status;
			const statusText = axiosError.response?.statusText;
			const errorMessage =
				axiosError.response?.data?.message ||
				axiosError.response?.data?.error ||
				`HTTP ${status} ${statusText}` ||
				'Failed to upload file to CDN';

			console.error('Axios error details:', {
				status,
				statusText,
				data: axiosError.response?.data,
			});

			return {
				success: false,
				error: errorMessage,
			};
		}

		if (error instanceof Error) {
			console.error('Error message:', error.message);
			console.error('Error stack:', error.stack);
		}

		return {
			success: false,
			error:
				error instanceof Error ? error.message : 'Failed to upload file to CDN',
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
