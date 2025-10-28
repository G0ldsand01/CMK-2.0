import { and, eq } from 'drizzle-orm';
import { productsTable, user, wishlistTable } from '@/db/schema';
import db from './db';

type UserDetails = Partial<
	Exclude<typeof user.$inferSelect, 'id' | 'email' | 'role'>
>;

export const setUserDetails = async (userId: string, details: UserDetails) => {
	await db.update(user).set(details).where(eq(user.id, userId));
};

export const getUserWishlist = async (userId: string) => {
	const wishlist = await db
		.select()
		.from(wishlistTable)
		.where(eq(wishlistTable.userId, userId))
		.innerJoin(productsTable, eq(wishlistTable.productId, productsTable.id));

	return wishlist;
};

export const addToUserWishlist = async (userId: string, productId: number) => {
	await db.insert(wishlistTable).values({
		userId,
		productId,
	});
};

export const removeFromUserWishlist = async (
	userId: string,
	productId: number,
) => {
	await db
		.delete(wishlistTable)
		.where(
			and(
				eq(wishlistTable.userId, userId),
				eq(wishlistTable.productId, productId),
			),
		);
};
