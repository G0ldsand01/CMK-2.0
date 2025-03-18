// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';

import tailwindcss from '@tailwindcss/vite';
import dotenv from 'dotenv';

import vercel from '@astrojs/vercel';

import db from '@astrojs/db';

dotenv.config();

// https://astro.build/config
export default defineConfig({
  // prefetch: true,
  integrations: [react(), db()],

  output: 'server',

  vite: {
    plugins: [tailwindcss()]
  },

  adapter: vercel(),
});