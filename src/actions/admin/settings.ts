import { ActionError, defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import { eq } from 'drizzle-orm';
import { systemSettingsTable } from '@/db/schema';
import { authServer } from '@/lib/auth-server';
import db from '@/lib/db';
import { logSecurityEvent } from '../index';

export const settings = {
	getSettings: defineAction({
		handler: async (_input, context) => {
			try {
				const session = await authServer.api.getSession({
					headers: context.request.headers,
				});

				const user = session?.user;

				if (!user || user.role !== 'admin') {
					logSecurityEvent('UNAUTHORIZED_ACCESS', 'anonymous', {
						ip: context.request.headers.get('x-forwarded-for'),
					});
					throw new ActionError({
						code: 'UNAUTHORIZED',
						message: 'User must be logged in and be an admin.',
					});
				}

				const allSettings = await db
					.select()
					.from(systemSettingsTable)
					.orderBy(systemSettingsTable.key);

				// Convert array to object for easier access
				const settingsObject: Record<string, string> = {};
				for (const setting of allSettings) {
					settingsObject[setting.key] = setting.value;
				}

				// Return default values if no settings exist
				return {
					success: true,
					settings: {
						siteName: settingsObject.siteName || 'CMK',
						siteUrl: settingsObject.siteUrl || 'https://cmk.com',
						maintenanceMode: settingsObject.maintenanceMode === 'true',
						allowRegistrations: settingsObject.allowRegistrations !== 'false',
						emailNotifications: settingsObject.emailNotifications !== 'false',
					},
				};
			} catch (error) {
				console.error('Error fetching settings:', error);
				if (error instanceof ActionError) {
					throw error;
				}
				throw new ActionError({
					code: 'INTERNAL_ERROR',
					message: 'Failed to fetch settings',
				});
			}
		},
	}),

	updateSettings: defineAction({
		input: z.object({
			siteName: z.string().min(1, 'Site name is required').max(255),
			siteUrl: z
				.string()
				.min(1, 'Site URL is required')
				.refine(
					(url) => {
						try {
							new URL(url);
							return true;
						} catch {
							return false;
						}
					},
					{ message: 'Invalid URL format' },
				),
			maintenanceMode: z.boolean(),
			allowRegistrations: z.boolean(),
			emailNotifications: z.boolean(),
		}),
		handler: async (input, context) => {
			try {
				const session = await authServer.api.getSession({
					headers: context.request.headers,
				});

				const user = session?.user;

				if (!user || user.role !== 'admin') {
					logSecurityEvent('UNAUTHORIZED_ACCESS', 'anonymous', {
						ip: context.request.headers.get('x-forwarded-for'),
					});
					throw new ActionError({
						code: 'UNAUTHORIZED',
						message: 'User must be logged in and be an admin.',
					});
				}

				// Update or insert each setting
				const settingsToUpdate = [
					{ key: 'siteName', value: input.siteName },
					{ key: 'siteUrl', value: input.siteUrl },
					{ key: 'maintenanceMode', value: String(input.maintenanceMode) },
					{
						key: 'allowRegistrations',
						value: String(input.allowRegistrations),
					},
					{
						key: 'emailNotifications',
						value: String(input.emailNotifications),
					},
				];

				for (const setting of settingsToUpdate) {
					const existing = await db
						.select()
						.from(systemSettingsTable)
						.where(eq(systemSettingsTable.key, setting.key))
						.limit(1);

					if (existing.length > 0) {
						await db
							.update(systemSettingsTable)
							.set({
								value: setting.value,
								updatedBy: user.id,
							})
							.where(eq(systemSettingsTable.key, setting.key));
					} else {
						await db.insert(systemSettingsTable).values({
							key: setting.key,
							value: setting.value,
							updatedBy: user.id,
						});
					}
				}

				logSecurityEvent('SETTINGS_UPDATE', user.id, {
					settings: Object.keys(input),
					ip: context.request.headers.get('x-forwarded-for'),
				});

				return {
					success: true,
					message: 'Settings updated successfully',
				};
			} catch (error) {
				console.error('Error updating settings:', error);
				if (error instanceof ActionError) {
					throw error;
				}
				throw new ActionError({
					code: 'INTERNAL_ERROR',
					message: 'Failed to update settings',
				});
			}
		},
	}),
};
