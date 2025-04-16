import { ActionError, defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import {
	type ProductCategory,
	type ProductType,
	productsTable,
} from '@/db/schema';
import { uploadToCDN } from '@/lib/cdn';
import db from '@/lib/db';
import { getUser } from '@/lib/user';
import { eq } from 'drizzle-orm';
import { logSecurityEvent } from './index';

export const products = {
	getBestProducts: defineAction({
		handler: async () => {
			const products = await db.query.productsTable.findMany({
				limit: 32,
			});
			return products;
		},
	}),
	getProductsBySearch: defineAction({
		input: z.object({
			search: z.string(),
		}),
		handler: async (input) => {
			const products = await db.query.productsTable.findMany({
				where: eq(productsTable.name, input.search),
			});
			return products;
		},
	}),
	getProductsByType: defineAction({
		input: z.object({
			type: z.string(),
		}),
		handler: async (input) => {
			const products = await db.query.productsTable.findMany({
				// @ts-expect-error
				where: eq(productsTable.type, input.type),
				limit: 32,
			});
			return products;
		},
	}),
};
