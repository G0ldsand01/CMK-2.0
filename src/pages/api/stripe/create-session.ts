import type { APIRoute } from 'astro';
import { stripe } from '@/lib/stripe';
import db from '@/lib/db';
import { ordersTable } from '@/db/schema';

// Optionnel : URL pour tes futurs fichiers hébergés
const STORAGE_BASE_URL = import.meta.env.STORAGE_BASE_URL || '';

// ✅ Fonction utilitaire pour garantir une URL valide
function getSiteUrl(): string {
	const envSite = import.meta.env.SITE?.trim();
	if (
		envSite &&
		(envSite.startsWith('http://') || envSite.startsWith('https://'))
	) {
		return envSite.replace(/\/$/, ''); // retire le slash final
	}
	// fallback local
	return 'http://localhost:4321';
}

// ✅ Fonction pour convertir une couleur hex en nom simple
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
	return map[hex.toLowerCase()] || hex;
}

export const POST: APIRoute = async ({ request }) => {
	try {
		const data = await request.json();

		// Vérification des champs requis
		const required = ['firstName', 'lastName', 'email', 'price', 'filename'];
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

		const SITE_URL = getSiteUrl();

		// URL du fichier (futur serveur)
		const fileUrl =
			STORAGE_BASE_URL && data.filename
				? `${STORAGE_BASE_URL.replace(/\/$/, '')}/${data.filename}`
				: '';

		const material = data.material || 'PLA';
		const color = colorNameFromHex(data.color || '');
		const infill = data.infill ? `${data.infill}%` : 'N/A';
		const printer = data.printer ? `${data.printer}mm` : 'Unknown size';
		const volume = data.volumeCm3
			? `${Number(data.volumeCm3).toFixed(1)} cm³`
			: 'N/A';

		const customerFullName = `${data.firstName} ${data.lastName}`;

		// === Création de la session Stripe ===
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
							description: `Material: ${material} | Color: ${color} | Infill: ${infill} | Printer: ${printer} | Volume: ${volume}`,
						},
						unit_amount: Math.round(priceNumber * 100),
					},
					quantity: 1,
				},
			],
			metadata: {
				firstName: data.firstName,
				lastName: data.lastName,
				email: data.email,
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
				file_url: fileUrl,
			},
			success_url: `${SITE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
			cancel_url: `${SITE_URL}/cancel`,
		});

		// === Enregistrement en base de données ===
		try {
			await db.insert(ordersTable).values({
				customerEmail: data.email,
				customerName: customerFullName,
				status: 'pending',
				stripeSessionId: session.id,
				filename: data.filename,
				material,
				color,
				infill: data.infill ? Number(data.infill) : null,
				volumeCm3: data.volumeCm3 ? Number(data.volumeCm3) : null,
				price: priceNumber,
				fileUrl: fileUrl || null,
				notes: data.notes || null,
				createdAt: new Date(),
			});
		} catch (dbErr) {
			console.warn('⚠️ DB insert warning:', dbErr);
		}

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
