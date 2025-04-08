// @ts-check
import react from '@astrojs/react';
import vercel from '@astrojs/vercel';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, envField } from 'astro/config';
import compress from 'astro-compress';
import critters from 'astro-critters';
import auth from 'auth-astro';
import dotenv from 'dotenv';

dotenv.config();

// https://astro.build/config
export default defineConfig({
	// prefetch: true,
	integrations: [react(), auth(), critters(), compress()],

	output: 'server',

	vite: {
		plugins: [tailwindcss()],
	},

	adapter: vercel({
		imageService: true,
	}),

	env: {
		schema: {
			WEBSITE_URL: envField.string({
				access: 'public',
				context: 'server',
			}),
			DATABASE_URL: envField.string({
				access: 'secret',
				context: 'server',
			}),
			REDIS_URL: envField.string({
				access: 'secret',
				context: 'server',
				optional: true,
			}),

			/*
			Stripe
			*/

			STRIPE_WEBHOOK_SECRET: envField.string({
				access: 'secret',
				context: 'server',
			}),
			STRIPE_PUBLIC_KEY: envField.string({
				access: 'public',
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
