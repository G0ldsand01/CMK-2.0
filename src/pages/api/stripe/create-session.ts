import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import { ordersTable, threeDPrintOrdersTable } from '@/db/schema';
import db from '@/lib/db';
import { stripe } from '@/lib/stripe';
import fs from 'node:fs';
import path from 'node:path';

// Optionnel : base pour tes fichiers hébergés
const STORAGE_BASE_URL = import.meta.env.STORAGE_BASE_URL || '';

/* ======================
   🔧 URL HELPERS
====================== */

// ✅ Retourne l'URL du site à partir de l'environnement
function getSiteUrl(): string {
	// Essayer WEBSITE_URL d'abord (variable d'environnement standard du projet)
	const websiteUrl = import.meta.env.WEBSITE_URL?.trim();
	if (
		websiteUrl &&
		(websiteUrl.startsWith('http://') || websiteUrl.startsWith('https://'))
	) {
		return websiteUrl.replace(/\/$/, '');
	}

	// Essayer SITE ensuite
	const envSite = import.meta.env.SITE?.trim();
	if (
		envSite &&
		(envSite.startsWith('http://') || envSite.startsWith('https://'))
	) {
		return envSite.replace(/\/$/, '');
	}

	// Fallback local seulement en développement
	if (import.meta.env.MODE === 'development' || import.meta.env.DEV) {
		return 'http://localhost:4321';
	}

	// En production, retourner une URL par défaut (sera remplacée par la détection depuis la requête)
	return 'https://cmk-2-0-tau.vercel.app';
}

// ✅ Utilise une URL fournie dans la requête ou fallback vers celle du site
function getSiteUrlFromRequest(data?: Record<string, unknown>): string {
	const candidate = (
		data?.siteUrl ||
		data?.url ||
		data?.returnUrl ||
		''
	).trim();
	if (!candidate) return getSiteUrl();

	const normalized =
		candidate.startsWith('http://') || candidate.startsWith('https://')
			? candidate
			: `https://${candidate}`;

	try {
		const url = new URL(normalized);
		if (url.protocol !== 'http:' && url.protocol !== 'https:') {
			return getSiteUrl();
		}
		return url.origin.replace(/\/$/, '');
	} catch {
		return getSiteUrl();
	}
}

/* ======================
   🎨 UTILITIES
====================== */

function colorNameFromHex(hex: string): string {
	const map: Record<string, string> = {
		'#000000': 'Black',
		'#ffffff': 'White',
		'#808080': 'Gray',
		'#ff0000': 'Red',
		'#00ff00': 'Green',
		'#0000ff': 'Blue',
		'#ffff00': 'Yellow',
		'#ff00ff': 'Magenta',
		'#00ffff': 'Cyan',
	};
	return map[hex.toLowerCase()] || hex || 'Unknown';
}

/* ======================
   💳 MAIN ROUTE
====================== */

export const POST: APIRoute = async ({ request }) => {
	try {
		const data = await request.json();

		// === Validation ===
		const required = [
			'firstName',
			'lastName',
			'email',
			'phone',
			'price',
			'filename',
		];
		for (const key of required) {
			if (!data[key]) {
				return new Response(
					JSON.stringify({ error: `Missing required field: ${key}` }),
					{ status: 400, headers: { 'Content-Type': 'application/json' } },
				);
			}
		}

		const priceNumber = Number(data.price);
		if (Number.isNaN(priceNumber) || priceNumber <= 0) {
			return new Response(JSON.stringify({ error: 'Invalid price' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		// Essayer de détecter l'URL depuis la requête
		let SITE_URL = getSiteUrlFromRequest(data);

		// Si on n'a pas d'URL valide ou si c'est localhost, essayer de la construire depuis la requête
		if (!SITE_URL || SITE_URL.includes('localhost')) {
			// Essayer depuis les headers de la requête
			const origin = request.headers.get('origin');
			const referer = request.headers.get('referer');
			const host = request.headers.get('host');

			if (origin && !origin.includes('localhost')) {
				try {
					const url = new URL(origin);
					SITE_URL = url.origin;
				} catch {
					// Ignorer l'erreur
				}
			} else if (referer && !referer.includes('localhost')) {
				try {
					const url = new URL(referer);
					SITE_URL = url.origin;
				} catch {
					// Ignorer l'erreur
				}
			} else if (host && !host.includes('localhost')) {
				// Construire depuis le host (en production, utiliser HTTPS)
				const protocol =
					import.meta.env.MODE === 'development' ? 'http' : 'https';
				SITE_URL = `${protocol}://${host}`;
			} else {
				// Utiliser getSiteUrl() qui utilise WEBSITE_URL
				SITE_URL = getSiteUrl();
			}
		}

		// === File URL ===
		// File will be uploaded later or provided separately
		let fileUrl = data.fileUrl || data.file_url || '';

		console.log('📁 File URL received:', fileUrl);
		console.log('🌐 SITE_URL:', SITE_URL);

		// Convertir l'URL relative en URL absolue si nécessaire
		if (
			fileUrl &&
			!fileUrl.startsWith('http://') &&
			!fileUrl.startsWith('https://')
		) {
			// Si c'est une URL relative, la convertir en URL absolue
			if (fileUrl.startsWith('/')) {
				fileUrl = `${SITE_URL}${fileUrl}`;
			} else {
				fileUrl = `${SITE_URL}/${fileUrl}`;
			}
			console.log('📁 File URL converted to absolute:', fileUrl);
		}

		// === Metadata ===
		const material = data.material || 'PLA';
		const color = colorNameFromHex(data.color || '');
		const infill = data.infill ? `${data.infill}%` : 'N/A';
		const printer = data.printer ? `${data.printer}mm` : 'Unknown size';
		const volume = data.volumeCm3
			? `${Number(data.volumeCm3).toFixed(1)} cm³`
			: 'N/A';
		const customerFullName = `${data.firstName} ${data.lastName}`;

		// Build description with file download link if available
		// Stripe limite la description à 500 caractères, donc on doit être concis
		let description = `Material: ${material} | Color: ${color} | Infill: ${infill} | Printer: ${printer} | Volume: ${volume}`;
		if (data.notes) {
			const notesShort =
				data.notes.length > 50
					? data.notes.substring(0, 50) + '...'
					: data.notes;
			description += ` | Notes: ${notesShort}`;
		}

		// Ajouter l'URL du fichier si disponible
		if (fileUrl) {
			// S'assurer que la description totale ne dépasse pas 500 caractères
			const downloadText = ` | Download: ${fileUrl}`;
			const maxLength = 500;

			if (description.length + downloadText.length > maxLength) {
				// Tronquer la description pour faire de la place pour l'URL
				const availableSpace = maxLength - downloadText.length - 10; // 10 pour "..."
				description = description.substring(0, availableSpace) + '...';
			}

			description += downloadText;
			console.log(
				'✅ File URL added to description. Total length:',
				description.length,
			);
			console.log('📄 Description:', description);
		} else {
			console.warn(
				'⚠️ No file URL provided, description will not include download link',
			);
		}

		// === Stripe Session ===
		console.log(
			'🔗 Creating Stripe session with description length:',
			description.length,
		);
		console.log('📋 Full description:', description);
		console.log('📁 File URL in metadata:', fileUrl);

		// === Create Order First ===
		let orderId: number | null = null;
		try {
			const [newOrder] = await db
				.insert(threeDPrintOrdersTable)
				.values({
					customerEmail: data.email,
					customerName: customerFullName,
					firstName: data.firstName,
					lastName: data.lastName,
					phone: data.phone || null,
					address: data.address || null,
					city: data.city || null,
					state: data.state || null,
					zip: data.zip || null,
					country: data.country || null,
					status: 'pending',
					stripeSessionId: 'pending', // Will be updated after session creation
					filename: data.filename,
					material,
					color,
					infill: data.infill ? Number(data.infill) : null,
					volumeCm3: data.volumeCm3 ? Number(data.volumeCm3) : null,
					dims: data.dims ? JSON.stringify(data.dims) : null,
					printer: printer || null,
					price: priceNumber.toString(),
					fileUrl: fileUrl || null,
					notes: data.notes || null,
					createdAt: new Date(),
				})
				.returning({ id: threeDPrintOrdersTable.id });

			orderId = newOrder.id;
			console.log('✅ 3D Print order created with ID:', orderId);
		} catch (dbErr) {
			console.warn('⚠️ Database insert warning:', dbErr);
		}

		const session = await stripe.checkout.sessions.create({
			mode: 'payment',
			payment_method_types: ['card'],
			customer_email: data.email,
			line_items: [
				{
					price_data: {
						currency: 'cad',
						product_data: {
							name: `3D Print for ${customerFullName}: ${data.filename}`,
							description,
						},
						unit_amount: Math.round(priceNumber * 100),
					},
					quantity: 1,
				},
			],
			metadata: {
				orderType: '3dprint',
				firstName: data.firstName,
				lastName: data.lastName,
				email: data.email,
				phone: data.phone || '',
				address: data.address || '',
				city: data.city || '',
				state: data.state || '',
				zip: data.zip || '',
				country: data.country || '',
				material,
				printer,
				color,
				infill,
				notes: data.notes || '',
				filename: data.filename,
				filesize: data.filesize?.toString() || '',
				volumeCm3: data.volumeCm3?.toString() || '',
				dimensions: data.dims ? JSON.stringify(data.dims) : '',
				file_url: fileUrl || '',
				download_url: fileUrl || '', // For easy access in receipt
				order_id: orderId?.toString() || '',
			},
			success_url: `${SITE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
			cancel_url: `${SITE_URL}/cancel`,
			invoice_creation: {
				enabled: true,
			},
		});

		// === Update Order with Session ID ===
		if (orderId) {
			try {
				await db
					.update(threeDPrintOrdersTable)
					.set({ stripeSessionId: session.id })
					.where(eq(threeDPrintOrdersTable.id, orderId));

				// Organiser le fichier par numéro de commande et créer un fichier d'informations
				if (fileUrl) {
					await organizeOrderFiles(orderId, fileUrl, {
						customerEmail: data.email,
						customerName: customerFullName,
						firstName: data.firstName,
						lastName: data.lastName,
						phone: data.phone || '',
						address: data.address || '',
						city: data.city || '',
						state: data.state || '',
						zip: data.zip || '',
						country: data.country || '',
						filename: data.filename,
						material,
						color,
						infill: data.infill ? Number(data.infill) : null,
						volumeCm3: data.volumeCm3 ? Number(data.volumeCm3) : null,
						dims: data.dims || null,
						printer: printer || null,
						price: priceNumber,
						notes: data.notes || null,
						fileUrl,
						stripeSessionId: session.id,
					});
				}
			} catch (updateErr) {
				console.warn('⚠️ Order update warning:', updateErr);
			}
		}

		// === Success ===
		return new Response(JSON.stringify({ url: session.url }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		});
	} catch (err) {
		console.error('❌ Stripe create-session error:', err);
		return new Response(
			JSON.stringify({
				error: err instanceof Error ? err.message : 'Internal server error',
			}),
			{ status: 500, headers: { 'Content-Type': 'application/json' } },
		);
	}
};
