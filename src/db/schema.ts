import type { CartItem } from '@/lib/cart';
import type { AdapterAccount } from '@auth/core/adapters';
import {
	boolean,
	index,
	integer,
	jsonb,
	numeric,
	pgTable,
	primaryKey,
	real,
	serial,
	text,
	timestamp,
	uniqueIndex,
	varchar,
} from 'drizzle-orm/pg-core';

// Base CMK

export const productsTable = pgTable(
	'products',
	{
		id: serial('id').primaryKey(),
		name: varchar({ length: 255 }).notNull(),
		price: numeric().notNull(),
		description: text().notNull(),
		image: varchar({ length: 255 }).notNull(),
		category: varchar({ length: 255 }).notNull(),
		averageRating: real('average_rating').notNull().default(0),
	},
	(table) => [index('product_name_idx').on(table.name)],
);

export const reviewsTable = pgTable(
	'reviews',
	{
		id: serial('id').primaryKey(),
		productId: integer('productId')
			.notNull()
			.references(() => productsTable.id, { onDelete: 'cascade' }),
		userId: text('userId')
			.notNull()
			.references(() => usersTable.id, { onDelete: 'cascade' })
			.unique(),
		rating: integer('rating').notNull(),
		createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
	},
	(table) => [
		index('product_id_idx').on(table.productId),
		// Ensure one review per user per product
		uniqueIndex('user_product_unique_idx').on(table.userId, table.productId),
	],
);

export type UserRole = 'user' | 'admin';

// Unique user has multiple accounts
export const usersTable = pgTable('user', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	name: text('name'),
	email: text('email').unique(),
	emailVerified: timestamp('emailVerified', { mode: 'date' }),
	image: text('image'),

	role: text('role').$type<UserRole>().notNull().default('user'),

	// Custom user info
	firstName: text('firstName'),
	lastName: text('lastName'),
	phone: text('phone'),
	address: text('address'),
	city: text('city'),
	state: text('state'),
	zip: text('zip'),
	country: text('country'),
});

export const wishlistTable = pgTable('wishlist', {
	id: serial('id').primaryKey(),
	userId: text('userId')
		.notNull()
		.references(() => usersTable.id, { onDelete: 'cascade' }),
	productId: integer('productId')
		.notNull()
		.references(() => productsTable.id, { onDelete: 'cascade' }),
});

export const cartTable = pgTable('cart', {
	id: serial('id').primaryKey(),
	userId: text('userId')
		.notNull()
		.references(() => usersTable.id, { onDelete: 'cascade' }),
	productId: integer('productId')
		.notNull()
		.references(() => productsTable.id, { onDelete: 'cascade' }),
	quantity: integer('quantity').notNull().default(1),
});

export const ordersTable = pgTable('orders', {
	id: serial('id').primaryKey(),
	userId: text('userId')
		.notNull()
		.references(() => usersTable.id, { onDelete: 'cascade' }),
	stripeSessionId: text('stripeSessionId').notNull(),
	status: text('status').notNull(),
	cartJSON: jsonb('cartJSON').notNull().$type<CartItem[]>(),
	createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
});

/*
 *
 * Auth.js
 *
 */

// One to many relationship between users and accounts
export const accountsTable = pgTable(
	'account',
	{
		userId: text('userId')
			.notNull()
			.references(() => usersTable.id, { onDelete: 'cascade' }),
		type: text('type').$type<AdapterAccount['type']>().notNull(),
		provider: text('provider').notNull(),
		providerAccountId: text('providerAccountId').notNull(),
		refresh_token: text('refresh_token'),
		access_token: text('access_token'),
		expires_at: integer('expires_at'),
		token_type: text('token_type'),
		scope: text('scope'),
		id_token: text('id_token'),
		session_state: text('session_state'),
	},
	(account) => [
		{
			compoundKey: primaryKey({
				columns: [account.provider, account.providerAccountId],
			}),
		},
	],
);

export const sessionsTable = pgTable('session', {
	sessionToken: text('sessionToken').primaryKey(),
	userId: text('userId')
		.notNull()
		.references(() => usersTable.id, { onDelete: 'cascade' }),
	expires: timestamp('expires', { mode: 'date' }).notNull(),
});

export const verificationTokensTable = pgTable(
	'verificationToken',
	{
		identifier: text('identifier').notNull(),
		token: text('token').notNull(),
		expires: timestamp('expires', { mode: 'date' }).notNull(),
	},
	(verificationToken) => [
		{
			compositePk: primaryKey({
				columns: [verificationToken.identifier, verificationToken.token],
			}),
		},
	],
);

export const authenticatorsTable = pgTable(
	'authenticator',
	{
		credentialID: text('credentialID').notNull().unique(),
		userId: text('userId')
			.notNull()
			.references(() => usersTable.id, { onDelete: 'cascade' }),
		providerAccountId: text('providerAccountId').notNull(),
		credentialPublicKey: text('credentialPublicKey').notNull(),
		counter: integer('counter').notNull(),
		credentialDeviceType: text('credentialDeviceType').notNull(),
		credentialBackedUp: boolean('credentialBackedUp').notNull(),
		transports: text('transports'),
	},
	(authenticator) => [
		{
			compositePK: primaryKey({
				columns: [authenticator.userId, authenticator.credentialID],
			}),
		},
	],
);
