import {
	DISCORD_CLIENT_ID,
	DISCORD_CLIENT_SECRET,
	GITHUB_CLIENT_ID,
	GITHUB_CLIENT_SECRET,
	GOOGLE_CLIENT_ID,
	GOOGLE_CLIENT_SECRET,
} from 'astro:env/server';
import type { Adapter, AdapterAccountType } from '@auth/core/adapters';
import Discord from '@auth/core/providers/discord';
import GitHub from '@auth/core/providers/github';
import Google from '@auth/core/providers/google';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { defineConfig } from 'auth-astro';
import { and, eq } from 'drizzle-orm';
import {
	accountsTable,
	sessionsTable,
	usersTable,
	verificationTokensTable,
} from './src/db/schema';
import db from './src/lib/db';

export default defineConfig({
	adapter: DrizzleAdapter(db, {
		usersTable: usersTable,
		accountsTable: accountsTable,
		sessionsTable: sessionsTable,
		verificationTokensTable: verificationTokensTable,
	}) as Adapter,
	providers: [
		GitHub({
			clientId: GITHUB_CLIENT_ID,
			clientSecret: GITHUB_CLIENT_SECRET,
		}),
		Discord({
			clientId: DISCORD_CLIENT_ID,
			clientSecret: DISCORD_CLIENT_SECRET,
		}),
		Google({
			clientId: GOOGLE_CLIENT_ID,
			clientSecret: GOOGLE_CLIENT_SECRET,
		}),
	],
	callbacks: {
		async session({ session, user }) {
			// name, email image
			session.user.id = user.id;
			session.user.role = user.role;

			// Custom
			session.user.firstName = user.firstName;
			session.user.lastName = user.lastName;
			session.user.phone = user.phone;
			session.user.address = user.address;
			session.user.city = user.city;
			session.user.state = user.state;
			session.user.zip = user.zip;
			session.user.country = user.country;

			return session;
		},
		async signIn({ account, profile }) {
			if (!profile?.email) return false;

			const existingUser = await db.query.usersTable.findFirst({
				where: eq(usersTable.email, profile.email),
			});

			if (existingUser) {
				if (!account) return false;

				const existingAccount = await db.query.accountsTable.findFirst({
					where: and(
						eq(accountsTable.provider, account.provider),
						eq(accountsTable.providerAccountId, account.providerAccountId),
					),
				});

				if (!existingAccount) {
					await db.insert(accountsTable).values({
						userId: existingUser.id,
						type: account.type as AdapterAccountType,
						provider: account.provider,
						providerAccountId: account.providerAccountId,
					});
				}
			}

			return true;
		},
	},
});
