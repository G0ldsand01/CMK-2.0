import { map } from 'nanostores';
import type { productsTable, reviewsTable } from './db/schema';
import type { CartItem } from './lib/cart';

type Product = typeof productsTable.$inferSelect;
type Review = typeof reviewsTable.$inferSelect;

export const cartAtom = map<Record<string, CartItem>>({});
export const productReviewsAtom = map<Record<string, Review[]>>({});
