import { sql } from 'drizzle-orm';
import db from './db';

export async function updateAverageRating(productId: number) {
	await db.execute(sql`
		UPDATE products
		SET average_rating = COALESCE((
		  SELECT AVG(rating) FROM reviews WHERE product_id = ${productId}
		), 0)
		WHERE id = ${productId};
	`);
}
