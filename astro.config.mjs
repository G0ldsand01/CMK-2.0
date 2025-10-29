// @ts-check
import react from '@astrojs/react';
import vercel from '@astrojs/vercel';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, envField } from 'astro/config';
import compress from 'astro-compress';
import critters from 'astro-critters';
import dotenv from 'dotenv';

dotenv.config();

// https://astro.build/config
export default defineConfig({
	// prefetch: true,
	integrations: [react(), critters(), compress()],

	output: 'server',

	vite: {
		plugins: [tailwindcss()],
	},

	adapter: vercel({
		imageService: true,
	}),

	env: {
		schema: {
			NODE_ENV: envField.string({
				access: 'public',
				context: 'client',
				optional: true,
			}),
			DEV_MODE: envField.boolean({
				access: 'public',
				context: 'client',
				optional: true,
				default: false,
			}),

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
			DISCORD_WEBHOOK_URL: envField.string({
				access: 'secret',
				context: 'server',
				optional: true,
			}),
			CDN_URL: envField.string({
				access: 'public',
				context: 'client',
			}),
			CDN_SECRET: envField.string({
				access: 'secret',
				context: 'server',
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
			BETTER_AUTH_URL: envField.string({
				access: 'public',
				context: 'server',
			}),
			BETTER_AUTH_SECRET: envField.string({
				access: 'public',
				context: 'client',
			}),

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
