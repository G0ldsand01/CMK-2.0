import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import { and, asc, eq, like, ne } from 'drizzle-orm';
import {
	imageTable,
	type ProductType,
	productCategoryTable,
	productImageTable,
	productsTable,
} from '@/db/schema';
import db from '@/lib/db';
import type { ProductWithImages } from '@/store';

export const products = {
	getBestProducts: defineAction({
		handler: async () => {
			// Get all visible products first
			const allProducts = await db
				.select({
					id: productsTable.id,
					name: productsTable.name,
					description: productsTable.description,
					price: productsTable.price,
					type: productsTable.type,
					category: productsTable.category,
				})
				.from(productsTable)
				.where(eq(productsTable.visible, true))
				.limit(32);

			// Get images for each product
			const productsWithImages = await Promise.all(
				allProducts.map(async (product) => {
					const images = await db
						.select({
							image: imageTable,
						})
						.from(productImageTable)
						.where(eq(productImageTable.productId, product.id))
						.leftJoin(imageTable, eq(productImageTable.image, imageTable.id))
						.orderBy(asc(productImageTable.priority));

					return {
						...product,
						images: images.map((img) => img.image).filter(Boolean),
					} as ProductWithImages;
				}),
			);

			return productsWithImages;
		},
	}),
	getProductsBySearch: defineAction({
		input: z.object({
			search: z.string(),
		}),
		handler: async (input) => {
			const searchPattern = `%${input.search}%`;

			// Get all visible products matching search first
			const allProducts = await db
				.select({
					id: productsTable.id,
					name: productsTable.name,
					description: productsTable.description,
					price: productsTable.price,
					type: productsTable.type,
					category: productsTable.category,
				})
				.from(productsTable)
				.where(
					and(
						like(productsTable.name, searchPattern),
						eq(productsTable.visible, true),
					),
				)
				.limit(32);

			// Get images for each product
			const productsWithImages = await Promise.all(
				allProducts.map(async (product) => {
					const images = await db
						.select({
							image: imageTable,
						})
						.from(productImageTable)
						.where(eq(productImageTable.productId, product.id))
						.leftJoin(imageTable, eq(productImageTable.image, imageTable.id))
						.orderBy(asc(productImageTable.priority));

					return {
						...product,
						images: images.map((img) => img.image).filter(Boolean),
					} as ProductWithImages;
				}),
			);

			return productsWithImages;
		},
	}),
	getProductsByType: defineAction({
		input: z.object({
			type: z.string(),
		}),
		handler: async (input) => {
			// Get all visible products of this type first
			const allProducts = await db
				.select({
					id: productsTable.id,
					name: productsTable.name,
					description: productsTable.description,
					price: productsTable.price,
					type: productsTable.type,
					category: productsTable.category,
				})
				.from(productsTable)
				.where(
					and(
						eq(productsTable.type, input.type as ProductType),
						eq(productsTable.visible, true),
					),
				)
				.limit(32);

			// Get images for each product
			const productsWithImages = await Promise.all(
				allProducts.map(async (product) => {
					const images = await db
						.select({
							image: imageTable,
						})
						.from(productImageTable)
						.where(eq(productImageTable.productId, product.id))
						.leftJoin(imageTable, eq(productImageTable.image, imageTable.id))
						.orderBy(asc(productImageTable.priority));

					return {
						...product,
						images: images.map((img) => img.image).filter(Boolean),
					} as ProductWithImages;
				}),
			);

			return productsWithImages;
		},
	}),
	getProductsByCategory: defineAction({
		input: z.object({
			categoryId: z.number(),
		}),
		handler: async (input) => {
			// Get all visible products in this category first
			const allProducts = await db
				.select({
					id: productsTable.id,
					name: productsTable.name,
					description: productsTable.description,
					price: productsTable.price,
					type: productsTable.type,
					category: productsTable.category,
				})
				.from(productsTable)
				.where(
					and(
						eq(productsTable.category, input.categoryId),
						eq(productsTable.visible, true),
					),
				)
				.limit(32);

			// Get images for each product
			const productsWithImages = await Promise.all(
				allProducts.map(async (product) => {
					const images = await db
						.select({
							image: imageTable,
						})
						.from(productImageTable)
						.where(eq(productImageTable.productId, product.id))
						.leftJoin(imageTable, eq(productImageTable.image, imageTable.id))
						.orderBy(asc(productImageTable.priority));

					return {
						...product,
						images: images.map((img) => img.image).filter(Boolean),
					} as ProductWithImages;
				}),
			);

			return productsWithImages;
		},
	}),
	getCategories: defineAction({
		handler: async () => {
			const categories = await db.select().from(productCategoryTable);
			return categories;
		},
	}),

	getSuggestedProducts: defineAction({
		input: z.object({
			productId: z.number(),
			categoryId: z.number().optional(),
			type: z.string().optional(),
			limit: z.number().optional().default(4),
		}),
		handler: async (input) => {
			// Get products from the same category first, excluding current product
			let allProducts: Array<{
				id: number;
				name: string;
				description: string;
				price: string;
				type: ProductType;
				category: number;
			}> = [];

			if (input.categoryId) {
				allProducts = await db
					.select({
						id: productsTable.id,
						name: productsTable.name,
						description: productsTable.description,
						price: productsTable.price,
						type: productsTable.type,
						category: productsTable.category,
					})
					.from(productsTable)
					.where(
						and(
							eq(productsTable.category, input.categoryId),
							eq(productsTable.visible, true),
							ne(productsTable.id, input.productId),
						),
					)
					.limit(input.limit);
			}

			// If not enough products from same category, add products from same type
			if (allProducts.length < input.limit && input.type) {
				const existingIds = new Set(allProducts.map((p) => p.id));
				const additionalProducts = await db
					.select({
						id: productsTable.id,
						name: productsTable.name,
						description: productsTable.description,
						price: productsTable.price,
						type: productsTable.type,
						category: productsTable.category,
					})
					.from(productsTable)
					.where(
						and(
							eq(productsTable.type, input.type as ProductType),
							eq(productsTable.visible, true),
							ne(productsTable.id, input.productId),
						),
					)
					.limit(input.limit - allProducts.length);

				// Filter out duplicates
				const uniqueAdditional = additionalProducts.filter(
					(p) => !existingIds.has(p.id),
				);
				allProducts = [...allProducts, ...uniqueAdditional];
			}

			// If still not enough, get any other visible products
			if (allProducts.length < input.limit) {
				const existingIds = new Set(allProducts.map((p) => p.id));
				const moreProducts = await db
					.select({
						id: productsTable.id,
						name: productsTable.name,
						description: productsTable.description,
						price: productsTable.price,
						type: productsTable.type,
						category: productsTable.category,
					})
					.from(productsTable)
					.where(
						and(
							eq(productsTable.visible, true),
							ne(productsTable.id, input.productId),
						),
					)
					.limit(input.limit - allProducts.length);

				const uniqueMore = moreProducts.filter((p) => !existingIds.has(p.id));
				allProducts = [...allProducts, ...uniqueMore];
			}

			// Get images for each product
			const productsWithImages = await Promise.all(
				allProducts.map(async (product) => {
					const images = await db
						.select({
							image: imageTable,
						})
						.from(productImageTable)
						.where(eq(productImageTable.productId, product.id))
						.leftJoin(imageTable, eq(productImageTable.image, imageTable.id))
						.orderBy(asc(productImageTable.priority));

					return {
						...product,
						images: images.map((img) => img.image).filter(Boolean),
					} as ProductWithImages;
				}),
			);

			return productsWithImages;
		},
	}),
};
