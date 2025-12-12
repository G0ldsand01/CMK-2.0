import { actions } from 'astro:actions';
import { Bell, Plus, Trash2, RefreshCw, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';

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

	const fetchNotifications = async () => {
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
		} catch (error) {
			console.error('Error fetching notifications:', error);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchNotifications();
	}, []);

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
		} catch (error) {
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
		} catch (error) {
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
					<Badge variant="outline" className="border-green-500 text-green-500">
						Success
					</Badge>
				);
			default:
				return <Badge variant="outline">Info</Badge>;
		}
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h2 className="text-2xl font-bold">Notifications</h2>
				<Button onClick={() => setCreateDialogOpen(true)}>
					<Plus className="size-4 mr-2" />
					Create Notification
				</Button>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>All Notifications</CardTitle>
					<CardDescription>
						View and manage all system notifications
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="rounded-md border">
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
				</CardContent>
			</Card>

			{/* Create Notification Dialog */}
			<Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Create Notification</DialogTitle>
						<DialogDescription>
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
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Delete Notification</DialogTitle>
						<DialogDescription>
							Are you sure you want to delete this notification? This action
							cannot be undone.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setDeleteDialogOpen(false)}>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={handleDeleteNotification}
							disabled={isLoading}>
							Delete
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
