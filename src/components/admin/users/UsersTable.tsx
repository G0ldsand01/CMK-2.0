import { actions } from 'astro:actions';
import {
	ArrowUpDown,
	ArrowUp,
	ArrowDown,
	Search,
	X,
	Edit,
	Trash2,
	Key,
	CircleUserRound,
	Mail,
	CheckCircle2,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import EditUserForm from './EditUserForm';

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

interface UsersTableProps {
	initialUsers: UserData[];
	totalUsers: number;
}

export default function UsersTable({
	initialUsers,
	totalUsers: initialTotalUsers,
}: UsersTableProps) {
	const [users, setUsers] = useState<UserData[]>(initialUsers);
	const [currentPage, setCurrentPage] = useState(1);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [totalUsers, setTotalUsers] = useState(initialTotalUsers);
	const [searchQuery, setSearchQuery] = useState('');
	const [sortBy, setSortBy] = useState<'name' | 'email' | 'role' | 'createdAt'>(
		'createdAt',
	);
	const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
	const [editingUser, setEditingUser] = useState<UserData | null>(null);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [userToDelete, setUserToDelete] = useState<UserData | null>(null);
	const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
	const [userToResetPassword, setUserToResetPassword] =
		useState<UserData | null>(null);
	const [newPassword, setNewPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [toastMessage, setToastMessage] = useState<{
		title: string;
		description: string;
		variant?: 'default' | 'destructive';
	} | null>(null);

	const itemsPerPage = 20;
	const totalPages = Math.ceil(totalUsers / itemsPerPage);

	useEffect(() => {
		if (Array.isArray(initialUsers)) {
			setUsers(initialUsers);
		} else {
			setUsers([]);
			setError('Invalid users data received');
		}
	}, [initialUsers]);

	const fetchUsers = async (
		page: number,
		search?: string,
		sort?: string,
		order?: string,
	) => {
		if (page < 1 || isLoading) return;

		setIsLoading(true);
		setError(null);
		try {
			const { data, error } = await actions.admin.users.getUsers({
				limit: itemsPerPage,
				offset: (page - 1) * itemsPerPage,
				search: search || searchQuery,
				sortBy: (sort || sortBy) as any,
				sortOrder: (order || sortOrder) as any,
			});

			if (!error && data) {
				setUsers(data.data);
				setCurrentPage(page);
				setTotalUsers(data.total);
			} else {
				setError('Failed to fetch users');
				setUsers([]);
			}
		} catch (error) {
			if (error instanceof Error) {
				setError(error.message);
			} else {
				setError('An error occurred while fetching users');
			}
			setUsers([]);
		} finally {
			setIsLoading(false);
		}
	};

	const handleSearch = (query: string) => {
		setSearchQuery(query);
		fetchUsers(1, query, sortBy, sortOrder);
	};

	const handleSort = (field: 'name' | 'email' | 'role' | 'createdAt') => {
		const newOrder = sortBy === field && sortOrder === 'desc' ? 'asc' : 'desc';
		setSortBy(field);
		setSortOrder(newOrder);
		fetchUsers(currentPage, searchQuery, field, newOrder);
	};

	const handlePageChange = async (newPage: number) => {
		await fetchUsers(newPage, searchQuery, sortBy, sortOrder);
	};

	const handleDelete = async () => {
		if (!userToDelete) return;

		try {
			const { error } = await actions.admin.users.deleteUser({
				userId: userToDelete.id,
			});

			if (!error) {
				setToastMessage({
					title: 'Success',
					description: 'User deleted successfully',
				});
				setDeleteDialogOpen(false);
				setUserToDelete(null);
				await fetchUsers(currentPage, searchQuery, sortBy, sortOrder);
				setTimeout(() => setToastMessage(null), 3000);
			} else {
				setToastMessage({
					title: 'Error',
					description: error.message || 'Failed to delete user',
					variant: 'destructive',
				});
				setTimeout(() => setToastMessage(null), 3000);
			}
		} catch (error) {
			setToastMessage({
				title: 'Error',
				description: 'An error occurred while deleting the user',
				variant: 'destructive',
			});
			setTimeout(() => setToastMessage(null), 3000);
		}
	};

	const handleResetPassword = async () => {
		if (!userToResetPassword || !newPassword || !confirmPassword) return;

		if (newPassword !== confirmPassword) {
			setToastMessage({
				title: 'Error',
				description: 'Passwords do not match',
				variant: 'destructive',
			});
			setTimeout(() => setToastMessage(null), 3000);
			return;
		}

		if (newPassword.length < 8) {
			setToastMessage({
				title: 'Error',
				description: 'Password must be at least 8 characters',
				variant: 'destructive',
			});
			setTimeout(() => setToastMessage(null), 3000);
			return;
		}

		try {
			const { error } = await actions.admin.users.resetPassword({
				userId: userToResetPassword.id,
				newPassword,
			});

			if (!error) {
				setToastMessage({
					title: 'Success',
					description: 'Password reset successfully',
				});
				setResetPasswordDialogOpen(false);
				setUserToResetPassword(null);
				setNewPassword('');
				setConfirmPassword('');
				setTimeout(() => setToastMessage(null), 3000);
			} else {
				setToastMessage({
					title: 'Error',
					description: error.message || 'Failed to reset password',
					variant: 'destructive',
				});
				setTimeout(() => setToastMessage(null), 3000);
			}
		} catch (error) {
			setToastMessage({
				title: 'Error',
				description: 'An error occurred while resetting the password',
				variant: 'destructive',
			});
			setTimeout(() => setToastMessage(null), 3000);
		}
	};

	const getSortIcon = (field: 'name' | 'email' | 'role' | 'createdAt') => {
		if (sortBy !== field) {
			return <ArrowUpDown className="size-3.5 text-muted-foreground" />;
		}
		return sortOrder === 'asc' ? (
			<ArrowUp className="size-3.5 text-primary" />
		) : (
			<ArrowDown className="size-3.5 text-primary" />
		);
	};

	return (
		<div className="space-y-4">
			{/* Toast Message */}
			{toastMessage && (
				<div
					className={`fixed top-4 right-4 z-50 p-4 rounded-md shadow-lg ${
						toastMessage.variant === 'destructive'
							? 'bg-destructive text-destructive-foreground'
							: 'bg-primary text-primary-foreground'
					}`}>
					<div className="font-semibold">{toastMessage.title}</div>
					<div className="text-sm">{toastMessage.description}</div>
				</div>
			)}
			{/* Search Bar */}
			<div className="flex items-center gap-2">
				<div className="relative flex-1">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
					<Input
						type="text"
						placeholder="Search by name, email..."
						value={searchQuery}
						onChange={(e) => handleSearch(e.target.value)}
						className="pl-9 pr-9"
					/>
					{searchQuery && (
						<Button
							variant="ghost"
							size="sm"
							className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
							onClick={() => handleSearch('')}>
							<X className="size-4" />
						</Button>
					)}
				</div>
				{searchQuery && (
					<Badge variant="secondary" className="text-xs">
						{totalUsers} result{totalUsers !== 1 ? 's' : ''}
					</Badge>
				)}
			</div>

			{/* Table */}
			<div className="rounded-md border">
				<Table>
					<TableHeader>
						<TableRow className="hover:bg-transparent">
							<TableHead className="h-12">
								<Button
									variant="ghost"
									size="sm"
									className="h-8 -ml-2 gap-1.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground"
									onClick={() => handleSort('name')}>
									Name
									{getSortIcon('name')}
								</Button>
							</TableHead>
							<TableHead className="h-12">
								<Button
									variant="ghost"
									size="sm"
									className="h-8 -ml-2 gap-1.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground"
									onClick={() => handleSort('email')}>
									Email
									{getSortIcon('email')}
								</Button>
							</TableHead>
							<TableHead className="h-12">
								<Button
									variant="ghost"
									size="sm"
									className="h-8 -ml-2 gap-1.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground"
									onClick={() => handleSort('role')}>
									Role
									{getSortIcon('role')}
								</Button>
							</TableHead>
							<TableHead className="h-12">Status</TableHead>
							<TableHead className="h-12">
								<Button
									variant="ghost"
									size="sm"
									className="h-8 -ml-2 gap-1.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground"
									onClick={() => handleSort('createdAt')}>
									Created
									{getSortIcon('createdAt')}
								</Button>
							</TableHead>
							<TableHead className="h-12 text-right">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{isLoading ? (
							<TableRow>
								<TableCell colSpan={6} className="text-center py-8">
									Loading...
								</TableCell>
							</TableRow>
						) : users.length === 0 ? (
							<TableRow>
								<TableCell colSpan={6} className="text-center py-8">
									<div className="flex flex-col items-center gap-2">
										<p className="text-sm font-medium text-muted-foreground">
											No users found
										</p>
									</div>
								</TableCell>
							</TableRow>
						) : (
							users.map((user) => (
								<TableRow key={user.id} className="hover:bg-muted/30">
									<TableCell>
										<div className="flex items-center gap-3">
											<div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-muted overflow-hidden">
												{/* Always show icon as fallback */}
												<div
													className="absolute inset-0 flex items-center justify-center bg-background rounded-full z-10"
													id={`icon-${user.id}`}>
													<CircleUserRound className="h-10 w-10 text-muted-foreground" />
												</div>
												{/* Only show image if user.image exists and is valid */}
												{user.image &&
												user.image !== null &&
												user.image !== undefined &&
												String(user.image).trim() !== '' &&
												user.image !== 'null' &&
												user.image !== 'undefined' ? (
													<img
														src={user.image}
														alt={user.name}
														className="absolute inset-0 h-full w-full rounded-full object-cover z-20"
														onError={(e) => {
															// Hide image on error
															e.currentTarget.style.display = 'none';
															// Show icon
															const iconContainer = document.getElementById(
																`icon-${user.id}`,
															);
															if (iconContainer) {
																iconContainer.style.display = 'flex';
															}
														}}
														onLoad={(e) => {
															// Hide icon when image loads successfully
															const iconContainer = document.getElementById(
																`icon-${user.id}`,
															);
															if (iconContainer) {
																iconContainer.style.display = 'none';
															}
														}}
													/>
												) : null}
											</div>
											<div className="flex flex-col">
												<span className="font-medium">{user.name}</span>
												{(user.firstName || user.lastName) && (
													<span className="text-xs text-muted-foreground">
														{user.firstName} {user.lastName}
													</span>
												)}
											</div>
										</div>
									</TableCell>
									<TableCell>
										<div className="flex items-center gap-2">
											<Mail className="size-4 text-muted-foreground" />
											<span>{user.email}</span>
											{user.emailVerified && (
												<CheckCircle2 className="size-4 text-green-600" />
											)}
										</div>
									</TableCell>
									<TableCell>
										<Badge
											variant={user.role === 'admin' ? 'default' : 'secondary'}>
											{user.role}
										</Badge>
									</TableCell>
									<TableCell>
										<div className="flex flex-col gap-1">
											{user.hasPassword ? (
												<Badge variant="outline" className="w-fit text-xs">
													<Key className="size-3 mr-1" />
													Password
												</Badge>
											) : (
												<Badge variant="outline" className="w-fit text-xs">
													{user.providerId || 'OAuth'}
												</Badge>
											)}
										</div>
									</TableCell>
									<TableCell>
										<span className="text-sm text-muted-foreground">
											{new Date(user.createdAt).toLocaleDateString()}
										</span>
									</TableCell>
									<TableCell className="text-right">
										<div className="flex items-center justify-end gap-2">
											<EditUserForm
												user={user}
												onSuccess={() =>
													fetchUsers(
														currentPage,
														searchQuery,
														sortBy,
														sortOrder,
													)
												}
											/>
											<Button
												variant="ghost"
												size="sm"
												type="button"
												onClick={(e) => {
													e.preventDefault();
													e.stopPropagation();
													setUserToResetPassword(user);
													setResetPasswordDialogOpen(true);
												}}
												title="Reset Password">
												<Key className="size-4" />
											</Button>
											<Button
												variant="ghost"
												size="sm"
												type="button"
												onClick={(e) => {
													e.preventDefault();
													e.stopPropagation();
													setUserToDelete(user);
													setDeleteDialogOpen(true);
												}}
												title="Delete User">
												<Trash2 className="size-4 text-destructive" />
											</Button>
										</div>
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</div>

			{/* Pagination */}
			{totalPages > 1 && (
				<div className="flex items-center justify-between">
					<div className="text-sm text-muted-foreground">
						Page {currentPage} of {totalPages} ({totalUsers} total users)
					</div>
					<div className="flex gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => handlePageChange(currentPage - 1)}
							disabled={currentPage === 1 || isLoading}>
							Previous
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={() => handlePageChange(currentPage + 1)}
							disabled={currentPage === totalPages || isLoading}>
							Next
						</Button>
					</div>
				</div>
			)}

			{/* Delete Dialog */}
			<Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Delete User</DialogTitle>
						<DialogDescription>
							Are you sure you want to delete {userToDelete?.name}? This action
							cannot be undone.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setDeleteDialogOpen(false)}>
							Cancel
						</Button>
						<Button variant="destructive" onClick={handleDelete}>
							Delete
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Reset Password Dialog */}
			<Dialog
				open={resetPasswordDialogOpen}
				onOpenChange={setResetPasswordDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Reset Password</DialogTitle>
						<DialogDescription>
							Reset password for {userToResetPassword?.name}
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label htmlFor="newPassword">New Password</Label>
							<Input
								id="newPassword"
								type="password"
								value={newPassword}
								onChange={(e) => setNewPassword(e.target.value)}
								placeholder="Enter new password (min 8 characters)"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="confirmPassword">Confirm Password</Label>
							<Input
								id="confirmPassword"
								type="password"
								value={confirmPassword}
								onChange={(e) => setConfirmPassword(e.target.value)}
								placeholder="Confirm new password"
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setResetPasswordDialogOpen(false)}>
							Cancel
						</Button>
						<Button onClick={handleResetPassword}>Reset Password</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
