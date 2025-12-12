import { actions } from 'astro:actions';
import { authClient } from '@/lib/auth-client';
import { useState } from 'react';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Mail, Phone, MapPin, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

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
}

export default function SettingsManager({
	user: initialUser,
}: SettingsManagerProps) {
	const [user, setUser] = useState<UserData>(initialUser);
	const [isSaving, setIsSaving] = useState(false);
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

	return (
		<div className="space-y-6">
			{/* Profile Information */}
			<Card>
				<CardHeader>
					<div className="flex items-center gap-2">
						<User className="size-5" />
						<CardTitle>Profile Information</CardTitle>
					</div>
					<CardDescription>Update your personal information</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit} className="space-y-6">
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
								className="w-full md:w-auto">
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
		</div>
	);
}
