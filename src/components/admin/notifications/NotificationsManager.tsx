import { actions } from 'astro:actions';
import { Plus, Trash2, User } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';

type Notification = {
	id: number;
	userId: string;
	title: string;
	message: string;
	type: 'info' | 'warning' | 'error' | 'success';
	read: boolean;
	createdAt: Date;
	user: {
		id: string;
		name: string;
		email: string;
	} | null;
};

export default function NotificationsManager() {
	const [notifications, setNotifications] = useState<Notification[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [createDialogOpen, setCreateDialogOpen] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [notificationToDelete, setNotificationToDelete] =
		useState<Notification | null>(null);
	const [formData, setFormData] = useState({
		userId: '',
		title: '',
		message: '',
		type: 'info' as 'info' | 'warning' | 'error' | 'success',
	});

	const fetchNotifications = useCallback(async () => {
		setIsLoading(true);
		try {
			const { data, error } =
				await actions.admin.notifications.getAllNotifications({
					limit: 100,
					offset: 0,
				});

			if (!error && data) {
				setNotifications(data.data || []);
			}
		} catch (err) {
			console.error('Error fetching notifications:', err);
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchNotifications();
	}, [fetchNotifications]);

	const handleCreateNotification = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);

		try {
			const { error } = await actions.admin.notifications.createNotification({
				userId: formData.userId,
				title: formData.title,
				message: formData.message,
				type: formData.type,
			});

			if (!error) {
				setCreateDialogOpen(false);
				setFormData({
					userId: '',
					title: '',
					message: '',
					type: 'info',
				});
				await fetchNotifications();
			} else {
				alert(error.message || 'Failed to create notification');
			}
		} catch (err) {
			console.error('Error creating notification:', err);
			alert('An error occurred while creating the notification');
		} finally {
			setIsLoading(false);
		}
	};

	const handleDeleteNotification = async () => {
		if (!notificationToDelete) return;

		setIsLoading(true);
		try {
			const { error } = await actions.admin.notifications.deleteNotification({
				notificationId: notificationToDelete.id,
			});

			if (!error) {
				setDeleteDialogOpen(false);
				setNotificationToDelete(null);
				await fetchNotifications();
			} else {
				alert(error.message || 'Failed to delete notification');
			}
		} catch (err) {
			console.error('Error deleting notification:', err);
			alert('An error occurred while deleting the notification');
		} finally {
			setIsLoading(false);
		}
	};

	const getTypeBadge = (type: string) => {
		switch (type) {
			case 'error':
				return <Badge variant="destructive">Error</Badge>;
			case 'warning':
				return (
					<Badge
						variant="outline"
						className="border-yellow-500 text-yellow-500">
						Warning
					</Badge>
				);
			case 'success':
				return (
					<Badge variant="outline" className="border-primary text-primary">
						Success
					</Badge>
				);
			default:
				return <Badge variant="outline">Info</Badge>;
		}
	};

	return (
		<div className="space-y-4 sm:space-y-6">
			<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
				<h2 className="text-xl sm:text-2xl font-bold">Notifications</h2>
				<Button
					onClick={() => setCreateDialogOpen(true)}
					className="w-full sm:w-auto">
					<Plus className="size-4 mr-2" />
					Create Notification
				</Button>
			</div>

			<Card>
				<CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6">
					<CardTitle className="text-lg sm:text-xl">
						All Notifications
					</CardTitle>
					<CardDescription className="text-xs sm:text-sm">
						View and manage all system notifications
					</CardDescription>
				</CardHeader>
				<CardContent className="px-0 sm:px-6 pb-4 sm:pb-6">
					{/* Desktop Table View */}
					<div className="hidden md:block rounded-md border">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>User</TableHead>
									<TableHead>Title</TableHead>
									<TableHead>Message</TableHead>
									<TableHead>Type</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>Created</TableHead>
									<TableHead className="text-right">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{isLoading ? (
									<TableRow>
										<TableCell colSpan={7} className="text-center">
											Loading...
										</TableCell>
									</TableRow>
								) : notifications.length === 0 ? (
									<TableRow>
										<TableCell colSpan={7} className="text-center">
											No notifications found
										</TableCell>
									</TableRow>
								) : (
									notifications.map((notif) => (
										<TableRow key={notif.id}>
											<TableCell>
												{notif.user ? (
													<div className="flex items-center gap-2">
														<User className="size-4" />
														<span>{notif.user.name}</span>
													</div>
												) : (
													<span className="text-muted-foreground">
														User deleted
													</span>
												)}
											</TableCell>
											<TableCell className="font-medium">
												{notif.title}
											</TableCell>
											<TableCell className="max-w-xs truncate">
												{notif.message}
											</TableCell>
											<TableCell>{getTypeBadge(notif.type)}</TableCell>
											<TableCell>
												<Badge variant={notif.read ? 'secondary' : 'default'}>
													{notif.read ? 'Read' : 'Unread'}
												</Badge>
											</TableCell>
											<TableCell>
												{new Date(notif.createdAt).toLocaleDateString()}
											</TableCell>
											<TableCell className="text-right">
												<Button
													variant="ghost"
													size="sm"
													onClick={() => {
														setNotificationToDelete(notif);
														setDeleteDialogOpen(true);
													}}>
													<Trash2 className="size-4 text-destructive" />
												</Button>
											</TableCell>
										</TableRow>
									))
								)}
							</TableBody>
						</Table>
					</div>

					{/* Mobile Card View */}
					<div className="md:hidden space-y-3 px-4">
						{isLoading ? (
							<div className="text-center py-8 text-sm text-muted-foreground">
								Loading...
							</div>
						) : notifications.length === 0 ? (
							<div className="text-center py-8 text-sm text-muted-foreground">
								No notifications found
							</div>
						) : (
							notifications.map((notif) => (
								<div
									key={notif.id}
									className="rounded-lg border bg-card p-4 space-y-3">
									<div className="flex items-start justify-between gap-2">
										<div className="flex-1 space-y-1">
											<div className="flex items-center gap-2">
												{notif.user ? (
													<div className="flex items-center gap-2">
														<User className="size-4 text-muted-foreground" />
														<span className="text-sm font-medium">
															{notif.user.name}
														</span>
													</div>
												) : (
													<span className="text-xs text-muted-foreground">
														User deleted
													</span>
												)}
											</div>
											<h3 className="font-semibold text-base">{notif.title}</h3>
											<p className="text-sm text-muted-foreground line-clamp-2">
												{notif.message}
											</p>
										</div>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => {
												setNotificationToDelete(notif);
												setDeleteDialogOpen(true);
											}}
											className="shrink-0">
											<Trash2 className="size-4 text-destructive" />
										</Button>
									</div>
									<div className="flex flex-wrap items-center gap-2 pt-2 border-t">
										{getTypeBadge(notif.type)}
										<Badge variant={notif.read ? 'secondary' : 'default'}>
											{notif.read ? 'Read' : 'Unread'}
										</Badge>
										<span className="text-xs text-muted-foreground">
											{new Date(notif.createdAt).toLocaleDateString()}
										</span>
									</div>
								</div>
							))
						)}
					</div>
				</CardContent>
			</Card>

			{/* Create Notification Dialog */}
			<Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
				<DialogContent className="w-[95vw] sm:w-full max-w-md">
					<DialogHeader>
						<DialogTitle className="text-lg sm:text-xl">
							Create Notification
						</DialogTitle>
						<DialogDescription className="text-sm">
							Send a notification to a specific user
						</DialogDescription>
					</DialogHeader>
					<form onSubmit={handleCreateNotification} className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="userId">User ID *</Label>
							<Input
								id="userId"
								value={formData.userId}
								onChange={(e) =>
									setFormData({ ...formData, userId: e.target.value })
								}
								placeholder="user_123..."
								required
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="title">Title *</Label>
							<Input
								id="title"
								value={formData.title}
								onChange={(e) =>
									setFormData({ ...formData, title: e.target.value })
								}
								placeholder="Notification title"
								required
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="message">Message *</Label>
							<Textarea
								id="message"
								value={formData.message}
								onChange={(e) =>
									setFormData({ ...formData, message: e.target.value })
								}
								placeholder="Notification message"
								rows={4}
								required
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="type">Type *</Label>
							<Select
								value={formData.type}
								onValueChange={(
									value: 'info' | 'warning' | 'error' | 'success',
								) => setFormData({ ...formData, type: value })}>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="info">Info</SelectItem>
									<SelectItem value="warning">Warning</SelectItem>
									<SelectItem value="error">Error</SelectItem>
									<SelectItem value="success">Success</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={() => setCreateDialogOpen(false)}
								disabled={isLoading}>
								Cancel
							</Button>
							<Button type="submit" disabled={isLoading}>
								{isLoading ? 'Creating...' : 'Create Notification'}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			{/* Delete Dialog */}
			<Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
				<DialogContent className="w-[95vw] sm:w-full max-w-md">
					<DialogHeader>
						<DialogTitle className="text-lg sm:text-xl">
							Delete Notification
						</DialogTitle>
						<DialogDescription className="text-sm">
							Are you sure you want to delete this notification? This action
							cannot be undone.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
						<Button
							variant="outline"
							onClick={() => setDeleteDialogOpen(false)}
							className="w-full sm:w-auto">
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={handleDeleteNotification}
							disabled={isLoading}
							className="w-full sm:w-auto">
							Delete
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
