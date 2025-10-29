import { inferAdditionalFields } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';
import type { auth } from '../../auth';
import { BETTER_AUTH_SECRET } from 'astro:env/client';

export const authClient = createAuthClient({
	baseURL: BETTER_AUTH_SECRET,
	plugins: [inferAdditionalFields<typeof auth>()],
});
