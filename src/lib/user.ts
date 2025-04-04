import { getSession } from 'auth-astro/server';
import User from './models/user';

export async function getUser(request: Request) {
	const session = await getSession(request);
	if (!session || !session.user) {
		return null;
	}

	return new User(request, session.user);
}
