import type { Logger } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as baseSchema from '@/db/schema';

export const schema = {
	...baseSchema,
};

class MyLogger implements Logger {
	logQuery(_query: string, _params: unknown[]): void {
		// log({ query, params });
	}
}

const db = drizzle(process.env.DATABASE_URL!, {
	schema,
	logger: new MyLogger(),
});

export default db;
