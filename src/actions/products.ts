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
import type { ProductWithImages } from '@/store';
import { eq, like } from 'drizzle-orm';

export const products = {
	getBestProducts: defineAction({
		handler: async () => {
			const products = await db
				.select({
					id: productsTable.id,
					name: productsTable.name,
					description: productsTable.description,
					price: productsTable.price,
					type: productsTable.type,
					category: productsTable.category,
					images: imageTable,
				})
				.from(productsTable)
				.innerJoin(
					productImageTable,
					eq(productsTable.id, productImageTable.productId),
				)
				.innerJoin(imageTable, eq(productImageTable.image, imageTable.id))
				.limit(32);

			const groupedProducts = products.reduce((acc, curr) => {
				const existingProduct = acc.find((p) => p.id === curr.id);
				if (existingProduct) {
					existingProduct.images.push(curr.images);
				} else {
					acc.push({
						...curr,
						images: [curr.images],
					});
				}
				return acc;
			}, [] as ProductWithImages[]);

			return groupedProducts;
		},
	}),
	getProductsBySearch: defineAction({
		input: z.object({
			search: z.string(),
		}),
		handler: async (input) => {
			const searchPattern = `%${input.search}%`;

			const products = await db
				.select({
					id: productsTable.id,
					name: productsTable.name,
					description: productsTable.description,
					price: productsTable.price,
					type: productsTable.type,
					category: productsTable.category,
					images: imageTable,
				})
				.from(productsTable)
				.where(like(productsTable.name, searchPattern))
				.innerJoin(
					productImageTable,
					eq(productsTable.id, productImageTable.productId),
				)
				.innerJoin(imageTable, eq(productImageTable.image, imageTable.id))
				.limit(32);

			const groupedProducts = products.reduce((acc, curr) => {
				const existingProduct = acc.find((p) => p.id === curr.id);
				if (existingProduct) {
					existingProduct.images.push(curr.images);
				} else {
					acc.push({
						...curr,
						images: [curr.images],
					});
				}
				return acc;
			}, [] as ProductWithImages[]);

			return groupedProducts;
		},
	}),
	getProductsByType: defineAction({
		input: z.object({
			type: z.string(),
		}),
		handler: async (input) => {
			const products = await db
				.select({
					id: productsTable.id,
					name: productsTable.name,
					description: productsTable.description,
					price: productsTable.price,
					type: productsTable.type,
					category: productsTable.category,
					images: imageTable,
				})
				.from(productsTable)
				.where(eq(productsTable.type, input.type as ProductType))
				.innerJoin(
					productImageTable,
					eq(productsTable.id, productImageTable.productId),
				)
				.innerJoin(imageTable, eq(productImageTable.image, imageTable.id))
				.limit(32);

			const groupedProducts = products.reduce((acc, curr) => {
				const existingProduct = acc.find((p) => p.id === curr.id);
				if (existingProduct) {
					existingProduct.images.push(curr.images);
				} else {
					acc.push({
						...curr,
						images: [curr.images],
					});
				}
				return acc;
			}, [] as ProductWithImages[]);

			return groupedProducts;
		},
	}),
	getProductsByCategory: defineAction({
		input: z.object({
			categoryId: z.number(),
		}),
		handler: async (input) => {
			const products = await db
				.select({
					id: productsTable.id,
					name: productsTable.name,
					description: productsTable.description,
					price: productsTable.price,
					type: productsTable.type,
					category: productsTable.category,
					images: imageTable,
				})
				.from(productsTable)
				.where(eq(productsTable.category, input.categoryId))
				.innerJoin(
					productImageTable,
					eq(productsTable.id, productImageTable.productId),
				)
				.innerJoin(imageTable, eq(productImageTable.image, imageTable.id))
				.limit(32);

			const groupedProducts = products.reduce((acc, curr) => {
				const existingProduct = acc.find((p) => p.id === curr.id);
				if (existingProduct) {
					existingProduct.images.push(curr.images);
				} else {
					acc.push({
						...curr,
						images: [curr.images],
					});
				}
				return acc;
			}, [] as ProductWithImages[]);

			return groupedProducts;
		},
	}),
	getCategories: defineAction({
		handler: async () => {
			const categories = await db.select().from(productCategoryTable);
			return categories;
		},
	}),
};
