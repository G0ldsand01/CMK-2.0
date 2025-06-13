import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import {
	type ProductType,
	imageTable,
	productCategoryTable,
	productImageTable,
	productsTable,
} from '@/db/schema';
import db from '@/lib/db';
import { eq, like } from 'drizzle-orm';

export const products = {
	getBestProducts: defineAction({
		handler: async () => {
			const products = await db
				.select()
				.from(productsTable)
				.limit(32)
				.innerJoin(
					productImageTable,
					eq(productsTable.id, productImageTable.productId),
				)
				.innerJoin(imageTable, eq(productImageTable.image, imageTable.id));
			return products;
		},
	}),
	getProductsBySearch: defineAction({
		input: z.object({
			search: z.string(),
		}),
		handler: async (input) => {
			const searchPattern = `%${input.search}%`;

			const products = await db
				.select()
				.from(productsTable)
				.where(like(productsTable.name, searchPattern))
				.innerJoin(
					productImageTable,
					eq(productsTable.id, productImageTable.productId),
				)
				.innerJoin(imageTable, eq(productImageTable.image, imageTable.id))
				.limit(32);
			return products;
		},
	}),
	getProductsByType: defineAction({
		input: z.object({
			type: z.string(),
		}),
		handler: async (input) => {
			const products = await db
				.select()
				.from(productsTable)
				.where(eq(productsTable.type, input.type as ProductType))
				.innerJoin(
					productImageTable,
					eq(productsTable.id, productImageTable.productId),
				)
				.innerJoin(imageTable, eq(productImageTable.image, imageTable.id))
				.limit(32);
			return products;
		},
	}),
	getProductsByCategory: defineAction({
		input: z.object({
			categoryId: z.number(),
		}),
		handler: async (input) => {
			const products = await db
				.select()
				.from(productsTable)
				.where(eq(productsTable.category, input.categoryId))
				.innerJoin(
					productImageTable,
					eq(productsTable.id, productImageTable.productId),
				)
				.innerJoin(imageTable, eq(productImageTable.image, imageTable.id))
				.limit(32);
			return products;
		},
	}),
	getCategories: defineAction({
		handler: async () => {
			const categories = await db.select().from(productCategoryTable);
			return categories;
		},
	}),
};
