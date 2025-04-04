import { DATABASE_URL } from 'astro:env/server';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as baseSchema from '@/db/schema';

export const schema = {
	...baseSchema,
};

const db = drizzle(DATABASE_URL, { schema });

export default db;
