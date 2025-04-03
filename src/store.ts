import { map } from 'nanostores';
import type { CartItem } from './lib/cart';

export const cartAtom = map<Record<string, CartItem>>({});
