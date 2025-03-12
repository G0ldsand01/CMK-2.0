// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';

import tailwindcss from '@tailwindcss/vite';
import dotenv from 'dotenv';

import vercel from '@astrojs/vercel';

dotenv.config();

// https://astro.build/config
export default defineConfig({
  // prefetch: true,
  integrations: [react()],

  output: 'server',

  vite: {
    plugins: [tailwindcss()]
  },

  adapter: vercel({
    webAnalytics: {
      enabled: true,
    },
  })
});