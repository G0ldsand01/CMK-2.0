// @ts-check
import { defineConfig, envField } from 'astro/config';
import auth from 'auth-astro';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import dotenv from 'dotenv';
import vercel from '@astrojs/vercel';

import compress from 'astro-compress';

import critters from 'astro-critters';

dotenv.config();

// https://astro.build/config
export default defineConfig({
  // prefetch: true,
  integrations: [react(), auth(), critters(), compress()],

  output: 'server',

  vite: {
    plugins: [tailwindcss()],
  },

  adapter: vercel(),

  env: {
    schema: {
      DATABASE_URL: envField.string({
        access: 'secret',
        context: 'server',
      }),
      STRIPE_SECRET_KEY: envField.string({
        access: 'secret',
        context: 'server',
      }),

      /*
       Auth
      */
      GITHUB_CLIENT_ID: envField.string({
        access: 'secret',
        context: 'server',
        // TODO: Remove optional once we have a client ID
        optional: true,
      }),
      GITHUB_CLIENT_SECRET: envField.string({
        access: 'secret',
        context: 'server',
        // TODO: Remove optional once we have a client ID
        optional: true,
      }),
      DISCORD_CLIENT_ID: envField.string({
        access: 'secret',
        context: 'server',
      }),
      DISCORD_CLIENT_SECRET: envField.string({
        access: 'secret',
        context: 'server',
      }),
    },
  },
});
