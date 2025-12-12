import { log } from '@/lib/log';
import { admin } from './admin';
import { cart } from './cart';
import { products } from './products';
import { reviews } from './reviews';
import { user } from './user';
import { notifications } from './notifications';
import db from '@/lib/db';
import { securityLogsTable } from '@/db/schema';

// DO NOT TOUCH
export const server = {
	admin,
	cart,
	products,
	reviews,
	user,
	notifications,
};

// Logging & security utils
export const logSecurityEvent = async (
	event: string,
	userId: string,
	details: Record<string, unknown>,
	ip?: string | null,
	userAgent?: string | null,
) => {
	// Log to console and Discord
	log(`[SECURITY] ${event} - User: ${userId} - ${JSON.stringify(details)}`);

	// Save to database
	try {
		await db.insert(securityLogsTable).values({
			event,
			userId,
			details,
			ip: ip || null,
			userAgent: userAgent || null,
		});
	} catch (error) {
		console.error('Failed to save security log to database:', error);
		// Don't throw - logging should not break the application
	}
};

export const DANGEROUS_PATTERNS = [
	/<script>/i,
	/javascript:/i,
	/data:/i,
	/vbscript:/i,
	/on\w+=/i,
];

export const containsDangerousPattern = (str: string): boolean => {
	return DANGEROUS_PATTERNS.some((pattern) => pattern.test(str));
};
