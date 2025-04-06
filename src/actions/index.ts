import { cart } from './cart';
import { products } from './products';
import { reviews } from './reviews';
import { user } from './user';

export const server = {
	cart,
	//
	products,
	reviews,
	user,
};

// Logging & security utils

export const logSecurityEvent = (
	event: string,
	userId: string,
	details: Record<string, unknown>,
) => {
	console.log(
		`[SECURITY] ${event} - User: ${userId} - ${JSON.stringify(details)}`,
	);
	// TODO: Implement proper logging service (e.g., Winston, Pino)
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
