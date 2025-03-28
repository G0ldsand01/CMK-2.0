import {
  boolean,
  index,
  integer,
  numeric,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';
import type { AdapterAccount } from '@auth/core/adapters';

// Base CMK

export const productsTable = pgTable(
  'products',
  {
    id: integer().primaryKey(),
    name: varchar({ length: 255 }).notNull(),
    price: numeric().notNull(),
    description: text().notNull(),
    rating: numeric().notNull(),
    reviews: numeric().notNull(),
    image: varchar({ length: 255 }).notNull(),
  },
  (table) => [index('product_name_idx').on(table.name)]
);

// Unique user has multiple accounts
export const usersTable = pgTable('user', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text('name'),
  email: text('email').unique(),
  emailVerified: timestamp('emailVerified', { mode: 'date' }),
  image: text('image'),

  // Custom
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
  ]
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
  ]
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
  ]
);
