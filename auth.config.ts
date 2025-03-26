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
});
