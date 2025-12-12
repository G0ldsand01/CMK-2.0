import type { cartTable, productsTable } from '@/db/schema';
import { cartAtom } from '@/store';

export type CartItem = {
	products: typeof productsTable.$inferSelect;
	cart: typeof cartTable.$inferSelect;
	image?: string | null;
};

export function setCart(cart: CartItem[]) {
	cartAtom.set({});
	for (const item of cart) {
		cartAtom.setKey(item.products.id.toString(), {
			products: item.products,
			cart: item.cart,
			image: item.image || null,
		});
	}

	return cartAtom.get();
}

export function getCart() {
	return cartAtom.get();
}
