// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  // prefetch: true,
  integrations: [react()],
  output: 'server',

  vite: {
    plugins: [tailwindcss()]
  }
});