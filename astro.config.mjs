// @ts-check
import { defineConfig } from 'astro/config';
import auth from 'auth-astro';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import dotenv from 'dotenv';
import vercel from '@astrojs/vercel';

dotenv.config();

// https://astro.build/config
export default defineConfig({
  // prefetch: true,
  integrations: [react(), auth()],

  output: 'server',

  vite: {
    plugins: [tailwindcss()],
  },

  adapter: vercel(),
});
