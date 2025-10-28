import { inferAdditionalFields } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';
import type { auth } from '../../auth';

export const authClient = createAuthClient({
	baseURL:
		import.meta.env.PUBLIC_BETTER_AUTH_URL_PUBLIC || 'http://localhost:4321',
	plugins: [inferAdditionalFields<typeof auth>()],
});
