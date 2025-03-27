import GitHub from '@auth/core/providers/github';
import Discord from '@auth/core/providers/discord';
import { defineConfig } from 'auth-astro';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import db from './src/lib/db';
import type { Adapter } from '@auth/core/adapters';

import {
  usersTable,
  accountsTable,
  sessionsTable,
  verificationTokensTable,
} from './src/db/schema';

export default defineConfig({
  adapter: DrizzleAdapter(db, {
    usersTable: usersTable,
    accountsTable: accountsTable,
    sessionsTable: sessionsTable,
    verificationTokensTable: verificationTokensTable,
  }) as Adapter,
  providers: [
    GitHub({
      clientId: import.meta.env.GITHUB_CLIENT_ID,
      clientSecret: import.meta.env.GITHUB_CLIENT_SECRET,
    }),
    Discord({
      clientId: import.meta.env.DISCORD_CLIENT_ID,
      clientSecret: import.meta.env.DISCORD_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      // name, email image
      session.user.id = user.id;

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
  },
});
