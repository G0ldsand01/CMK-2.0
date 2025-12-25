import { actions } from 'astro:actions';
import {
	CheckCircle2,
	Key,
	Link as LinkIcon,
	Loader2,
	Lock,
	Mail,
	MapPin,
	Phone,
	Save,
	User,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authClient } from '@/lib/auth-client';

type UserData = {
	id: string;
	name: string;
	email: string;
	firstName: string | null;
	lastName: string | null;
	phone: string | null;
	address: string | null;
	city: string | null;
	state: string | null;
	zip: string | null;
	country: string | null;
};

interface SettingsManagerProps {
	user: UserData;
	hasPassword: boolean;
	linkedProviders: string[];
}

export default function SettingsManager({
	user: initialUser,
	hasPassword: initialHasPassword,
	linkedProviders: initialLinkedProviders,
}: SettingsManagerProps) {
	const [user, setUser] = useState<UserData>(initialUser);
	const [isSaving, setIsSaving] = useState(false);
	const [hasPassword, setHasPassword] = useState(initialHasPassword);
	const [linkedProviders, setLinkedProviders] = useState<string[]>(
		initialLinkedProviders,
	);
	const [changePasswordDialogOpen, setChangePasswordDialogOpen] =
		useState(false);
	const [passwordData, setPasswordData] = useState({
		currentPassword: '',
		newPassword: '',
		confirmPassword: '',
	});
	const [isChangingPassword, setIsChangingPassword] = useState(false);
	const [formData, setFormData] = useState({
		displayName: user.name || '',
		firstName: user.firstName || '',
		lastName: user.lastName || '',
		phone: user.phone || '',
		address: user.address || '',
		city: user.city || '',
		state: user.state || '',
		zip: user.zip || '',
		country: user.country || '',
	});

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSaving(true);

		try {
			// Update via better-auth
			await authClient.updateUser({
				name: formData.displayName,
				firstName: formData.firstName,
				lastName: formData.lastName,
				phone: formData.phone,
				address: formData.address,
				city: formData.city,
				state: formData.state,
			});

			// Update via our action
			const { error } = await actions.user.setUserDetails({
				email: user.email,
				displayName: formData.displayName,
				address: formData.address,
				firstName: formData.firstName,
				lastName: formData.lastName,
				phone: formData.phone,
				city: formData.city,
				state: formData.state,
				zip: formData.zip,
				country: formData.country,
			});

			if (!error) {
				setUser({
					...user,
					name: formData.displayName,
					firstName: formData.firstName,
					lastName: formData.lastName,
					phone: formData.phone,
					address: formData.address,
					city: formData.city,
					state: formData.state,
					zip: formData.zip,
					country: formData.country,
				});
				toast.success('Settings saved successfully!');
			} else {
				toast.error(error.message || 'Failed to save settings');
			}
		} catch (error) {
			console.error('Error saving settings:', error);
			toast.error('An error occurred while saving settings');
		} finally {
			setIsSaving(false);
		}
	};

	const handleChangePassword = async (e: React.FormEvent) => {
		e.preventDefault();

		if (passwordData.newPassword !== passwordData.confirmPassword) {
			toast.error('New passwords do not match');
			return;
		}

		if (passwordData.newPassword.length < 8) {
			toast.error('Password must be at least 8 characters long');
			return;
		}

		setIsChangingPassword(true);

		try {
			// Use better-auth's changePassword method
			// For users without password, currentPassword can be empty or we skip it
			const result = await authClient.changePassword({
				currentPassword: hasPassword ? passwordData.currentPassword : '',
				newPassword: passwordData.newPassword,
			});

			if (result.error) {
				toast.error(result.error.message || 'Failed to change password');
			} else {
				toast.success(
					hasPassword
						? 'Password changed successfully!'
						: 'Password set successfully!',
				);
				setChangePasswordDialogOpen(false);
				setPasswordData({
					currentPassword: '',
					newPassword: '',
					confirmPassword: '',
				});
				if (!hasPassword) {
					setHasPassword(true);
				}
			}
		} catch (error) {
			console.error('Error changing password:', error);
			toast.error('An error occurred while changing password');
		} finally {
			setIsChangingPassword(false);
		}
	};

	const getProviderIcon = (provider: string) => {
		switch (provider.toLowerCase()) {
			case 'google':
				return '🔵';
			case 'github':
				return '⚫';
			case 'discord':
				return '💜';
			default:
				return '🔗';
		}
	};

	const getProviderName = (provider: string) => {
		return provider.charAt(0).toUpperCase() + provider.slice(1);
	};

	return (
		<div className="space-y-4 sm:space-y-6">
			{/* Profile Information */}
			<Card>
				<CardHeader class="px-4 sm:px-6 pt-4 sm:pt-6">
					<div className="flex items-center gap-2">
						<User className="size-4 sm:size-5" />
						<CardTitle className="text-lg sm:text-xl">
							Profile Information
						</CardTitle>
					</div>
					<CardDescription className="text-xs sm:text-sm">
						Update your personal information
					</CardDescription>
				</CardHeader>
				<CardContent class="px-4 sm:px-6 pb-4 sm:pb-6">
					<form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
						<div className="grid gap-4 md:grid-cols-2">
							<div className="space-y-2">
								<Label htmlFor="displayName">Display Name *</Label>
								<Input
									id="displayName"
									name="displayName"
									value={formData.displayName}
									onChange={(e) =>
										setFormData({ ...formData, displayName: e.target.value })
									}
									required
									minLength={2}
									maxLength={50}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="email">Email</Label>
								<div className="relative">
									<Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground" />
									<Input
										id="email"
										name="email"
										type="email"
										value={user.email}
										disabled
										className="pl-10 bg-muted"
									/>
								</div>
								<p className="text-xs text-muted-foreground">
									Email cannot be changed
								</p>
							</div>
						</div>

						<div className="grid gap-4 md:grid-cols-2">
							<div className="space-y-2">
								<Label htmlFor="firstName">First Name *</Label>
								<Input
									id="firstName"
									name="firstName"
									value={formData.firstName}
									onChange={(e) =>
										setFormData({ ...formData, firstName: e.target.value })
									}
									required
									minLength={2}
									maxLength={50}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="lastName">Last Name *</Label>
								<Input
									id="lastName"
									name="lastName"
									value={formData.lastName}
									onChange={(e) =>
										setFormData({ ...formData, lastName: e.target.value })
									}
									required
									minLength={2}
									maxLength={50}
								/>
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="phone">Phone *</Label>
							<div className="relative">
								<Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground" />
								<Input
									id="phone"
									name="phone"
									type="tel"
									value={formData.phone}
									onChange={(e) =>
										setFormData({ ...formData, phone: e.target.value })
									}
									className="pl-10"
									required
									minLength={10}
									maxLength={20}
								/>
							</div>
						</div>

						{/* Address Section */}
						<div className="pt-4 border-t">
							<div className="flex items-center gap-2 mb-4">
								<MapPin className="size-5" />
								<CardTitle className="text-lg">Address Information</CardTitle>
							</div>

							<div className="space-y-2 mb-4">
								<Label htmlFor="address">Address *</Label>
								<Input
									id="address"
									name="address"
									value={formData.address}
									onChange={(e) =>
										setFormData({ ...formData, address: e.target.value })
									}
									required
									minLength={5}
									maxLength={200}
								/>
							</div>

							<div className="grid gap-4 md:grid-cols-2">
								<div className="space-y-2">
									<Label htmlFor="city">City *</Label>
									<Input
										id="city"
										name="city"
										value={formData.city}
										onChange={(e) =>
											setFormData({ ...formData, city: e.target.value })
										}
										required
										minLength={2}
										maxLength={100}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="state">State/Province *</Label>
									<Input
										id="state"
										name="state"
										value={formData.state}
										onChange={(e) =>
											setFormData({ ...formData, state: e.target.value })
										}
										required
										minLength={2}
										maxLength={100}
									/>
								</div>
							</div>

							<div className="grid gap-4 md:grid-cols-2 mt-4">
								<div className="space-y-2">
									<Label htmlFor="zip">ZIP/Postal Code *</Label>
									<Input
										id="zip"
										name="zip"
										value={formData.zip}
										onChange={(e) =>
											setFormData({ ...formData, zip: e.target.value })
										}
										required
										minLength={5}
										maxLength={10}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="country">Country *</Label>
									<Input
										id="country"
										name="country"
										value={formData.country}
										onChange={(e) =>
											setFormData({ ...formData, country: e.target.value })
										}
										required
										minLength={2}
										maxLength={100}
									/>
								</div>
							</div>
						</div>

						<div className="pt-4 border-t">
							<Button
								type="submit"
								disabled={isSaving}
								className="w-full sm:w-auto">
								{isSaving ? (
									<>
										<Loader2 className="size-4 mr-2 animate-spin" />
										Saving...
									</>
								) : (
									<>
										<Save className="size-4 mr-2" />
										Save Changes
									</>
								)}
							</Button>
						</div>
					</form>
				</CardContent>
			</Card>

			{/* Security Settings */}
			<Card>
				<CardHeader class="px-4 sm:px-6 pt-4 sm:pt-6">
					<div className="flex items-center gap-2">
						<Lock className="size-4 sm:size-5" />
						<CardTitle className="text-lg sm:text-xl">Security</CardTitle>
					</div>
					<CardDescription className="text-xs sm:text-sm">
						Manage your password and account security
					</CardDescription>
				</CardHeader>
				<CardContent class="px-4 sm:px-6 pb-4 sm:pb-6 space-y-4">
					{hasPassword ? (
						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm font-medium">Password</p>
									<p className="text-xs text-muted-foreground">
										Last updated: Recently
									</p>
								</div>
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={() => setChangePasswordDialogOpen(true)}
									className="gap-2">
									<Key className="size-3 sm:size-4" />
									Change Password
								</Button>
							</div>
						</div>
					) : (
						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm font-medium">No password set</p>
									<p className="text-xs text-muted-foreground">
										You're using social login. Set a password to enable
										email/password login.
									</p>
								</div>
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={() => setChangePasswordDialogOpen(true)}
									className="gap-2">
									<Key className="size-3 sm:size-4" />
									Set Password
								</Button>
							</div>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Linked Accounts */}
			<Card>
				<CardHeader class="px-4 sm:px-6 pt-4 sm:pt-6">
					<div className="flex items-center gap-2">
						<LinkIcon className="size-4 sm:size-5" />
						<CardTitle className="text-lg sm:text-xl">
							Linked Accounts
						</CardTitle>
					</div>
					<CardDescription className="text-xs sm:text-sm">
						Manage your social account connections
					</CardDescription>
				</CardHeader>
				<CardContent class="px-4 sm:px-6 pb-4 sm:pb-6">
					{linkedProviders.length > 0 ? (
						<div className="space-y-3">
							{linkedProviders.map((provider) => (
								<div
									key={provider}
									className="flex items-center justify-between p-3 rounded-lg border bg-card">
									<div className="flex items-center gap-3">
										<span className="text-xl">{getProviderIcon(provider)}</span>
										<div>
											<p className="text-sm font-medium">
												{getProviderName(provider)}
											</p>
											<p className="text-xs text-muted-foreground">
												Connected account
											</p>
										</div>
									</div>
									<Badge variant="default" className="gap-1.5">
										<CheckCircle2 className="size-3" />
										Connected
									</Badge>
								</div>
							))}
						</div>
					) : (
						<div className="text-center py-6">
							<LinkIcon className="size-12 text-muted-foreground mx-auto mb-3" />
							<p className="text-sm text-muted-foreground mb-2">
								No social accounts linked
							</p>
							<p className="text-xs text-muted-foreground">
								You can link social accounts when signing in
							</p>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Change Password Dialog */}
			<Dialog
				open={changePasswordDialogOpen}
				onOpenChange={setChangePasswordDialogOpen}>
				<DialogContent className="w-[95vw] sm:w-full max-w-md">
					<DialogHeader>
						<DialogTitle className="text-lg sm:text-xl">
							{hasPassword ? 'Change Password' : 'Set Password'}
						</DialogTitle>
						<DialogDescription className="text-sm">
							{hasPassword
								? 'Enter your current password and choose a new one'
								: 'Set a password to enable email/password login'}
						</DialogDescription>
					</DialogHeader>
					<form onSubmit={handleChangePassword} className="space-y-4">
						{hasPassword && (
							<div className="space-y-2">
								<Label htmlFor="currentPassword">Current Password *</Label>
								<Input
									id="currentPassword"
									type="password"
									value={passwordData.currentPassword}
									onChange={(e) =>
										setPasswordData({
											...passwordData,
											currentPassword: e.target.value,
										})
									}
									required={hasPassword}
									minLength={8}
								/>
							</div>
						)}
						<div className="space-y-2">
							<Label htmlFor="newPassword">
								{hasPassword ? 'New Password *' : 'Password *'}
							</Label>
							<Input
								id="newPassword"
								type="password"
								value={passwordData.newPassword}
								onChange={(e) =>
									setPasswordData({
										...passwordData,
										newPassword: e.target.value,
									})
								}
								required
								minLength={8}
								placeholder="At least 8 characters"
							/>
							<p className="text-xs text-muted-foreground">
								Password must be at least 8 characters long
							</p>
						</div>
						<div className="space-y-2">
							<Label htmlFor="confirmPassword">
								{hasPassword ? 'Confirm New Password *' : 'Confirm Password *'}
							</Label>
							<Input
								id="confirmPassword"
								type="password"
								value={passwordData.confirmPassword}
								onChange={(e) =>
									setPasswordData({
										...passwordData,
										confirmPassword: e.target.value,
									})
								}
								required
								minLength={8}
								placeholder="Confirm your password"
							/>
						</div>
						<DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
							<Button
								type="button"
								variant="outline"
								onClick={() => {
									setChangePasswordDialogOpen(false);
									setPasswordData({
										currentPassword: '',
										newPassword: '',
										confirmPassword: '',
									});
								}}
								disabled={isChangingPassword}
								className="w-full sm:w-auto">
								Cancel
							</Button>
							<Button
								type="submit"
								disabled={isChangingPassword}
								className="w-full sm:w-auto">
								{isChangingPassword ? (
									<>
										<Loader2 className="size-4 mr-2 animate-spin" />
										Updating...
									</>
								) : (
									<>
										<Key className="size-4 mr-2" />
										{hasPassword ? 'Change Password' : 'Set Password'}
									</>
								)}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>
		</div>
	);
}
