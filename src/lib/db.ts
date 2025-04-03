import { DATABASE_URL } from 'astro:env/server';
import * as schema from '@/db/schema';
import { drizzle } from 'drizzle-orm/node-postgres';

// export const schema = {
//   ...schema,
// };

const db = drizzle(DATABASE_URL, { schema });

export default db;
