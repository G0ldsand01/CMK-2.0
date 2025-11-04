import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import db, { schema } from './src/lib/db';

export const auth = betterAuth({
	baseURL: process.env.BETTER_AUTH_URL,
	secret: process.env.BETTER_AUTH_SECRET as string,
	database: drizzleAdapter(db, {
		provider: 'pg', // or "pg" or "mysql"
	}),
	schema: {
		...schema,
		user: schema.user,
	},
	user: {
		additionalFields: {
			role: {
				type: 'string',
				required: true,
				default: 'user',
				input: false, //prevent user from changing role
			},
			firstName: {
				type: 'string',
				required: false,
				default: '',
				input: true,
			},
			lastName: {
				type: 'string',
				required: false,
				default: '',
				input: true,
			},
			phone: {
				type: 'string',
				required: false,
				default: '',
				input: true,
			},
			address: {
				type: 'string',
				required: false,
				default: '',
				input: true,
			},
			city: {
				type: 'string',
				required: false,
				default: '',
				input: true,
			},
			state: {
				type: 'string',
				required: false,
				default: '',
				input: true,
			},
			zip: {
				type: 'string',
				required: false,
				default: '',
				input: true,
			},
			country: {
				type: 'string',
				required: false,
				default: '',
				input: true,
			},
		},
	},
	emailAndPassword: {
		enabled: true,
	},
	socialProviders: {
		github: {
			clientId: process.env.GITHUB_CLIENT_ID as string,
			clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
		},
		discord: {
			clientId: process.env.DISCORD_CLIENT_ID as string,
			clientSecret: process.env.DISCORD_CLIENT_SECRET as string,
		},
		google: {
			clientId: process.env.GOOGLE_CLIENT_ID as string,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
		},
	},
	account: {
		accountLinking: {
			enabled: true,
			allowDifferentEmails: true,
			trustedProviders: ['google', 'github', 'discord'],
		},
	},
});
