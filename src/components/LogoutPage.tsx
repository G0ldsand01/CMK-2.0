import { useEffect } from 'react';
import { authClient } from '@/lib/auth-client';

export function LogoutPage() {
	useEffect(() => {
		const handleLogout = async () => {
			await authClient.signOut();
			window.location.href = '/';
		};

		handleLogout();
	}, []);

	return (
		<div className="flex items-center justify-center min-h-screen">
			<div className="text-center">
				<div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
				<p className="text-muted-foreground">Logging out...</p>
			</div>
		</div>
	);
}
