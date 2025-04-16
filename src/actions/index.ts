import { log } from '@/lib/log';
import { cart } from './cart';
import { reviews } from './reviews';
import * as user from './admin/user';
import * as category from './admin/category';
import * as products from './admin/products';

export const admin = {
  user,
  category,
  products,
};

export const server = {
  admin,
  cart,
  reviews,
};

// Logging & security utils
export const logSecurityEvent = (
  event: string,
  userId: string,
  details: Record<string, unknown>
) => {
  log(`[SECURITY] ${event} - User: ${userId} - ${JSON.stringify(details)}`);
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
