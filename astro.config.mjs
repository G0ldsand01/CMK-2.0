import react from '@astrojs/react';
import vercel from '@astrojs/vercel';
import tailwindcss from '@tailwindcss/vite';
// @ts-check
import { defineConfig, envField } from 'astro/config';
import auth from 'auth-astro';
import dotenv from 'dotenv';

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
			}),
			GITHUB_CLIENT_SECRET: envField.string({
				access: 'secret',
				context: 'server',
			}),
			DISCORD_CLIENT_ID: envField.string({
				access: 'secret',
				context: 'server',
			}),
			DISCORD_CLIENT_SECRET: envField.string({
				access: 'secret',
				context: 'server',
			}),
			GOOGLE_CLIENT_ID: envField.string({
				access: 'secret',
				context: 'server',
			}),
			GOOGLE_CLIENT_SECRET: envField.string({
				access: 'secret',
				context: 'server',
			}),
		},
	},
});
