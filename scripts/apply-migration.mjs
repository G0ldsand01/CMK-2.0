import 'dotenv/config';
import { readFileSync } from 'fs';
import { join } from 'path';
import pg from 'pg';

const { Client } = pg;

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
	throw new Error('DATABASE_URL is not set');
}

async function applyMigration() {
	const client = new Client({
		connectionString: DATABASE_URL,
	});

	try {
		await client.connect();
		console.log('Connected to database');

		const migrationSQL = readFileSync(
			join(process.cwd(), 'drizzle', '0001_add_visible_to_products.sql'),
			'utf-8',
		);

		console.log('Applying migration...');
		await client.query(migrationSQL);
		console.log('Migration applied successfully!');
	} catch (error) {
		console.error('Error applying migration:', error);
		process.exit(1);
	} finally {
		await client.end();
	}
}

applyMigration();
