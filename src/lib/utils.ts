import { type ClassValue, clsx } from 'clsx';
import { sql, type ExtractTablesWithRelations } from 'drizzle-orm';
import { twMerge } from 'tailwind-merge';
import { reviewsTable } from '@/db/schema';
import db from './db';
import type User from './models/user';
import type { PgTransaction } from 'drizzle-orm/pg-core';
import type { NodePgQueryResultHKT } from 'drizzle-orm/node-postgres';
import type { schema } from './db';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export async function updateAverageRating(tx: PgTransaction<NodePgQueryResultHKT, typeof schema, ExtractTablesWithRelations<typeof schema>>, productId: number) {
	await tx.execute(sql`
		UPDATE products
		SET average_rating = COALESCE((
		  SELECT AVG(rating) FROM reviews WHERE product_id = ${productId}
		), 0)
		WHERE id = ${productId};
	`);
}

export async function addReview(user: User, productId: number, rating: number) {
	await db.transaction(async (tx) => {
		await tx.insert(reviewsTable).values({ productId, rating, userId: user.getId() });
		await updateAverageRating(tx, productId);
	});
}
