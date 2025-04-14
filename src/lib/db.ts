import { DATABASE_URL } from 'astro:env/server';
import type { Logger } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as baseSchema from '@/db/schema';

export const schema = {
	...baseSchema,
};

class MyLogger implements Logger {
	logQuery(query: string, params: unknown[]): void {
		// log({ query, params });
	}
}

const db = drizzle(DATABASE_URL, { schema, logger: new MyLogger() });

export default db;
