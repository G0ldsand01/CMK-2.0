import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '@/db/schema';
import { DATABASE_URL } from 'astro:env/server';

// export const schema = {
//   ...schema,
// };

const db = drizzle(DATABASE_URL, { schema });

export default db;
