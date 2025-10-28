import {
	boolean,
	index,
	integer,
	jsonb,
	numeric,
	pgTable,
	serial,
	text,
	timestamp,
	uniqueIndex,
	varchar,
} from 'drizzle-orm/pg-core';
import type { CartItem } from '@/lib/cart';

/*
 *
 * better-auth
 *
 */

export const user = pgTable('user', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	emailVerified: boolean('email_verified').default(false).notNull(),
	image: text('image'),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at')
		.defaultNow()
		.$onUpdate(() => /* @__PURE__ */ new Date())
		.notNull(),

	// Custom user info
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

export const session = pgTable('session', {
	id: text('id').primaryKey(),
	expiresAt: timestamp('expires_at').notNull(),
	token: text('token').notNull().unique(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at')
		.$onUpdate(() => /* @__PURE__ */ new Date())
		.notNull(),
	ipAddress: text('ip_address'),
	userAgent: text('user_agent'),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
});

export const account = pgTable('account', {
	id: text('id').primaryKey(),
	accountId: text('account_id').notNull(),
	providerId: text('provider_id').notNull(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	accessToken: text('access_token'),
	refreshToken: text('refresh_token'),
	idToken: text('id_token'),
	accessTokenExpiresAt: timestamp('access_token_expires_at'),
	refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
	scope: text('scope'),
	password: text('password'),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at')
		.$onUpdate(() => /* @__PURE__ */ new Date())
		.notNull(),
});

export const verification = pgTable('verification', {
	id: text('id').primaryKey(),
	identifier: text('identifier').notNull(),
	value: text('value').notNull(),
	expiresAt: timestamp('expires_at').notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at')
		.defaultNow()
		.$onUpdate(() => /* @__PURE__ */ new Date())
		.notNull(),
});

/*
 CMK
 */

export type ProductType = 'products' | 'models' | 'tech' | 'iot';

export const productsTable = pgTable(
	'products',
	{
		id: serial('id').primaryKey(),
		name: varchar({ length: 255 }).notNull(),
		price: numeric().notNull(),
		description: text().notNull(),
		thumbnail: varchar({ length: 255 }),
		category: integer('category')
			.notNull()
			.references(() => productCategoryTable.id),
		type: varchar({ length: 255 })
			.notNull()
			.$type<ProductType>()
			.default('products'),
	},
	(table) => [
		index('product_name_idx').on(table.name),
		uniqueIndex('product_id_unique').on(table.id),
	],
);

export const productImageTable = pgTable('product_image', {
	id: serial('id').primaryKey(),
	productId: integer('productId')
		.notNull()
		.references(() => productsTable.id, { onDelete: 'cascade' }),
	priority: integer('priority').notNull().default(0),
	image: integer('image')
		.notNull()
		.references(() => imageTable.id, { onDelete: 'cascade' }),
});

export const imageTable = pgTable('image', {
	id: serial('id').primaryKey(),
	image: varchar({ length: 255 }).notNull(),
});

export const productCategoryTable = pgTable('product_category', {
	id: serial('id').primaryKey(),
	name: varchar({ length: 255 }).notNull(),
});

export const reviewsTable = pgTable(
	'reviews',
	{
		id: serial('id').primaryKey(),
		productId: integer('productId')
			.notNull()
			.references(() => productsTable.id, { onDelete: 'cascade' }),
		userId: text('userId')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
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

export const wishlistTable = pgTable('wishlist', {
	id: serial('id').primaryKey(),
	userId: text('userId')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	productId: integer('productId')
		.notNull()
		.references(() => productsTable.id, { onDelete: 'cascade' }),
});

export const cartTable = pgTable('cart', {
	id: serial('id').primaryKey(),
	userId: text('userId')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	productId: integer('productId')
		.notNull()
		.references(() => productsTable.id, { onDelete: 'cascade' }),
	quantity: integer('quantity').notNull().default(1),
});

export const ordersTable = pgTable('orders', {
	id: serial('id').primaryKey(),
	userId: text('userId')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	stripeSessionId: text('stripeSessionId').notNull(),
	status: text('status').notNull(),
	cartJSON: jsonb('cartJSON').notNull().$type<CartItem[]>(),
	createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
});
