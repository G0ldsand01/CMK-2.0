import { actions } from 'astro:actions';
import { Edit, Save, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';

type UserData = {
	id: string;
	name: string;
	email: string;
	emailVerified: boolean;
	image: string | null;
	role: 'user' | 'admin';
	firstName: string | null;
	lastName: string | null;
	phone: string | null;
	address: string | null;
	city: string | null;
	state: string | null;
	zip: string | null;
	country: string | null;
	createdAt: Date;
	updatedAt: Date;
	hasPassword: boolean;
	providerId: string | null;
};

interface EditUserFormProps {
	user: UserData;
	onSuccess: () => void;
}

export default function EditUserForm({ user, onSuccess }: EditUserFormProps) {
	const [open, setOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [formData, setFormData] = useState({
		name: user.name,
		email: user.email,
		firstName: user.firstName || '',
		lastName: user.lastName || '',
		phone: user.phone || '',
		address: user.address || '',
		city: user.city || '',
		state: user.state || '',
		zip: user.zip || '',
		country: user.country || '',
		role: user.role,
		emailVerified: user.emailVerified,
	});

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);

		try {
			const { error } = await actions.admin.users.updateUser({
				userId: user.id,
				...formData,
			});

			if (!error) {
				setOpen(false);
				onSuccess();
			} else {
				alert(error.message || 'Failed to update user');
			}
		} catch (err) {
			console.error('Error updating user:', err);
			alert('An error occurred while updating the user');
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<>
			<Button
				variant="ghost"
				size="sm"
				title="Edit User"
				type="button"
				onClick={(e) => {
					e.preventDefault();
					e.stopPropagation();
					setOpen(true);
				}}>
				<Edit className="size-4" />
			</Button>
			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>Edit User Profile</DialogTitle>
						<DialogDescription>
							Update user information and settings
						</DialogDescription>
					</DialogHeader>
					<form onSubmit={handleSubmit} className="space-y-4">
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="name">Display Name *</Label>
								<Input
									id="name"
									value={formData.name}
									onChange={(e) =>
										setFormData({ ...formData, name: e.target.value })
									}
									required
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="email" className="text-sm">
									Email *
								</Label>
								<Input
									id="email"
									type="email"
									value={formData.email}
									onChange={(e) =>
										setFormData({ ...formData, email: e.target.value })
									}
									required
								/>
							</div>
						</div>

						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="firstName" className="text-sm">
									First Name
								</Label>
								<Input
									id="firstName"
									value={formData.firstName}
									onChange={(e) =>
										setFormData({ ...formData, firstName: e.target.value })
									}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="lastName">Last Name</Label>
								<Input
									id="lastName"
									value={formData.lastName}
									onChange={(e) =>
										setFormData({ ...formData, lastName: e.target.value })
									}
								/>
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="phone" className="text-sm">
								Phone
							</Label>
							<Input
								id="phone"
								type="tel"
								value={formData.phone}
								onChange={(e) =>
									setFormData({ ...formData, phone: e.target.value })
								}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="address" className="text-sm">
								Address
							</Label>
							<Input
								id="address"
								value={formData.address}
								onChange={(e) =>
									setFormData({ ...formData, address: e.target.value })
								}
							/>
						</div>

						<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
							<div className="space-y-2">
								<Label htmlFor="city" className="text-sm">
									City
								</Label>
								<Input
									id="city"
									value={formData.city}
									onChange={(e) =>
										setFormData({ ...formData, city: e.target.value })
									}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="state" className="text-sm">
									State/Province
								</Label>
								<Input
									id="state"
									value={formData.state}
									onChange={(e) =>
										setFormData({ ...formData, state: e.target.value })
									}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="zip">ZIP/Postal Code</Label>
								<Input
									id="zip"
									value={formData.zip}
									onChange={(e) =>
										setFormData({ ...formData, zip: e.target.value })
									}
								/>
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="country" className="text-sm">
								Country
							</Label>
							<Input
								id="country"
								value={formData.country}
								onChange={(e) =>
									setFormData({ ...formData, country: e.target.value })
								}
							/>
						</div>

						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="role" className="text-sm">
									Role
								</Label>
								<Select
									value={formData.role}
									onValueChange={(value: 'user' | 'admin') =>
										setFormData({ ...formData, role: value })
									}>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="user">User</SelectItem>
										<SelectItem value="admin">Admin</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-2">
								<Label htmlFor="emailVerified">Email Verified</Label>
								<Select
									value={formData.emailVerified ? 'true' : 'false'}
									onValueChange={(value) =>
										setFormData({
											...formData,
											emailVerified: value === 'true',
										})
									}>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="true">Verified</SelectItem>
										<SelectItem value="false">Not Verified</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>

						<DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
							<Button
								type="button"
								variant="outline"
								onClick={() => setOpen(false)}
								disabled={isLoading}
								className="w-full sm:w-auto">
								<X className="size-4 mr-2" />
								Cancel
							</Button>
							<Button
								type="submit"
								disabled={isLoading}
								className="w-full sm:w-auto">
								<Save className="size-4 mr-2" />
								{isLoading ? 'Saving...' : 'Save Changes'}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>
		</>
	);
}
