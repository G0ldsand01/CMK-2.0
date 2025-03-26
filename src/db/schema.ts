import { integer, numeric, pgTable, text, varchar } from 'drizzle-orm/pg-core';

export const usersTable = pgTable('users', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  age: integer().notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
});

export const productsTable = pgTable('products', {
  id: integer().primaryKey(),
  name: varchar({ length: 255 }).notNull(),
  price: numeric().notNull(),
  description: text().notNull(),
  rating: numeric().notNull(),
  reviews: numeric().notNull(),
  image: varchar({ length: 255 }).notNull(),
});
