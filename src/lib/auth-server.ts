import { auth } from '../../auth';

export const authServer = auth;

export const getCurrentUser = async (request: Request) => {
	const session = await authServer.api.getSession({
		headers: request.headers,
	});

	return session?.user;
};
