import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.log('DATABASE_URL is not set');
  throw new Error('DATABASE_URL is not set');
}

export default defineConfig({
  out: './drizzle',
  schema: './src/db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: DATABASE_URL,
  },
});
