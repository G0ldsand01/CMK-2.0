import { map } from 'nanostores';
import type { imageTable } from './db/schema';
import type { CartItem } from './lib/cart';

export type ProductType = 'products' | 'models' | 'tech' | 'iot';
export type Product = {
	id: number;
	name: string;
	price: string;
	description: string;
	category: number;
	type: ProductType;
};
export type Review = {
	id: number;
	productId: number;
	userId: string;
	rating: number;
	createdAt: Date;
};
export type Category = {
	id: number;
	name: string;
};
export interface ProductWithImages {
	id: number;
	name: string;
	description: string;
	price: string;
	type: ProductType;
	category: number;
	images: (typeof imageTable.$inferSelect)[];
}

export const cartAtom = map<Record<string, CartItem>>({});
export const productReviewsAtom = map<Record<string, Review[]>>({});
