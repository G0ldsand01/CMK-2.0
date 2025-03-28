import { ActionError, defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import { getSession } from 'auth-astro/server';
import { and, eq } from 'drizzle-orm';
import { containsDangerousPattern, logSecurityEvent } from './index';
import db from '@/lib/db';
import { productsTable, usersTable, wishlistTable } from '@/db/schema';

const sanitizeString = (str: string) => str.trim().replace(/[<>]/g, '');
const sanitizeEmail = (email: string) => email.toLowerCase().trim();
const sanitizePhone = (phone: string) => phone.replace(/[^\d+()-]/g, '');
const sanitizeZip = (zip: string) => zip.replace(/[^\d-]/g, '');

export const user = {
  setUserDetails: defineAction({
    input: z.object({
      displayName: z
        .string()
        .min(2, 'Display name must be at least 2 characters')
        .max(50, 'Display name must be less than 50 characters')
        .transform(sanitizeString)
        .refine((str) => !containsDangerousPattern(str), {
          message: 'Display name contains invalid characters',
        }),
      firstName: z
        .string()
        .min(2, 'First name must be at least 2 characters')
        .max(50, 'First name must be less than 50 characters')
        .transform(sanitizeString)
        .refine((str) => !containsDangerousPattern(str), {
          message: 'First name contains invalid characters',
        }),
      lastName: z
        .string()
        .min(2, 'Last name must be at least 2 characters')
        .max(50, 'Last name must be less than 50 characters')
        .transform(sanitizeString)
        .refine((str) => !containsDangerousPattern(str), {
          message: 'Last name contains invalid characters',
        }),
      phone: z
        .string()
        .min(10, 'Phone number must be at least 10 digits')
        .max(20, 'Phone number must be less than 20 characters')
        .transform(sanitizePhone),
      address: z
        .string()
        .min(5, 'Address must be at least 5 characters')
        .max(200, 'Address must be less than 200 characters')
        .transform(sanitizeString)
        .refine((str) => !containsDangerousPattern(str), {
          message: 'Address contains invalid characters',
        }),
      city: z
        .string()
        .min(2, 'City must be at least 2 characters')
        .max(100, 'City must be less than 100 characters')
        .transform(sanitizeString)
        .refine((str) => !containsDangerousPattern(str), {
          message: 'City contains invalid characters',
        }),
      state: z
        .string()
        .min(2, 'State must be at least 2 characters')
        .max(100, 'State must be less than 100 characters')
        .transform(sanitizeString)
        .refine((str) => !containsDangerousPattern(str), {
          message: 'State contains invalid characters',
        }),
      zip: z
        .string()
        .min(5, 'ZIP code must be at least 5 characters')
        .max(10, 'ZIP code must be less than 10 characters')
        .transform(sanitizeZip),
      country: z
        .string()
        .min(2, 'Country must be at least 2 characters')
        .max(100, 'Country must be less than 100 characters')
        .transform(sanitizeString)
        .refine((str) => !containsDangerousPattern(str), {
          message: 'Country contains invalid characters',
        }),
      email: z
        .string()
        .email('Invalid email format')
        .transform(sanitizeEmail)
        .refine((str) => !containsDangerousPattern(str), {
          message: 'Email contains invalid characters',
        }),
    }),
    handler: async (input, context) => {
      try {
        const session = await getSession(context.request);
        console.log('session', session);

        if (!session || !session.user || !session.user.id) {
          logSecurityEvent('UNAUTHORIZED_ACCESS', 'anonymous', {
            ip: context.request.headers.get('x-forwarded-for'),
          });
          throw new ActionError({
            code: 'UNAUTHORIZED',
            message: 'User must be logged in.',
          });
        }

        const existingId = session.user.id;

        const {
          displayName,
          firstName,
          lastName,
          phone,
          address,
          city,
          state,
          zip,
          country,
          email,
        } = input;

        logSecurityEvent('USER_DETAILS_UPDATE', existingId, {
          fields: [
            'displayName',
            'firstName',
            'lastName',
            'phone',
            'address',
            'city',
            'state',
            'zip',
            'country',
            'email',
          ],
        });

        await db
          .update(usersTable)
          .set({
            name: displayName,
            firstName,
            lastName,
            phone,
            address,
            city,
            state,
            zip,
            country,
            email,
          })
          .where(eq(usersTable.id, existingId));

        return {
          success: true,
          message: 'User details updated successfully',
        };
      } catch (error) {
        console.error(error);
        if (error instanceof ActionError) {
          throw error;
        }
        logSecurityEvent('UNEXPECTED_ERROR', 'unknown', {
          error: error instanceof Error ? error.message : 'Unknown error',
          ip: context?.request?.headers?.get('x-forwarded-for'),
        });
        throw new ActionError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred',
        });
      }
    },
  }),
  getWishlist: defineAction({
    handler: async (_input, context) => {
      try {
        const session = await getSession(context.request);

        if (!session || !session.user || !session.user.id) {
          logSecurityEvent('UNAUTHORIZED_ACCESS', 'anonymous', {
            ip: context.request.headers.get('x-forwarded-for'),
          });
          throw new ActionError({
            code: 'UNAUTHORIZED',
            message: 'User must be logged in.',
          });
        }

        const userId = session.user.id;

        const wishlist = await db
          .select()
          .from(wishlistTable)
          .where(eq(wishlistTable.userId, userId))
          .innerJoin(
            productsTable,
            eq(wishlistTable.productId, productsTable.id)
          );

        return {
          success: true,
          wishlist: wishlist,
        };
      } catch (error) {
        console.error(error);
        if (error instanceof ActionError) {
          throw error;
        }
        logSecurityEvent('UNEXPECTED_ERROR', 'unknown', {
          error: error instanceof Error ? error.message : 'Unknown error',
          ip: context?.request?.headers?.get('x-forwarded-for'),
        });
        throw new ActionError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred',
        });
      }
    },
  }),
  addRemoveProductToWishlist: defineAction({
    input: z.object({
      productId: z.string(),
    }),
    handler: async (input, context) => {
      try {
        const session = await getSession(context.request);

        if (!session || !session.user || !session.user.id) {
          logSecurityEvent('UNAUTHORIZED_ACCESS', 'anonymous', {
            ip: context.request.headers.get('x-forwarded-for'),
          });
          throw new ActionError({
            code: 'UNAUTHORIZED',
            message: 'User must be logged in.',
          });
        }

        const userId = session.user.id;
        const { productId } = input;

        const existingWishlist = await db
          .select()
          .from(wishlistTable)
          .where(eq(wishlistTable.userId, userId));

        if (
          existingWishlist.some(
            (wish: { id: number; userId: string; productId: number }) =>
              wish.productId === Number(productId)
          )
        ) {
          await db
            .delete(wishlistTable)
            .where(
              and(
                eq(wishlistTable.userId, userId),
                eq(wishlistTable.productId, Number(productId))
              )
            );

          return {
            success: true,
            message: 'Product removed from wishlist successfully',
            inWishlist: false,
            wishlist: existingWishlist.filter(
              (wish) => wish.productId !== Number(productId)
            ),
          };
        }

        await db
          .insert(wishlistTable)
          .values({
            userId,
            productId: Number(productId),
          })
          .onConflictDoNothing();

        const newWishlist = [
          ...existingWishlist.map((wish) => wish.productId),
          productId,
        ];

        return {
          success: true,
          message: 'Product added to wishlist successfully',
          inWishlist: true,
          wishlist: newWishlist,
        };
      } catch (error) {
        console.error(error);
        if (error instanceof ActionError) {
          throw error;
        }
        logSecurityEvent('UNEXPECTED_ERROR', 'unknown', {
          error: error instanceof Error ? error.message : 'Unknown error',
          ip: context?.request?.headers?.get('x-forwarded-for'),
        });
        throw new ActionError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred',
        });
      }
    },
  }),
};
