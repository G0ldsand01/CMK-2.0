import { actions } from 'astro:actions';
import { Bell, Check, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuDescription,
	DropdownMenuHeader,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// ScrollArea will be implemented inline for now

type Notification = {
	id: number;
	title: string;
	message: string;
	type: string;
	read: boolean;
	createdAt: Date;
};

interface NotificationBellProps {
	userId: string;
}

export default function NotificationBell({ userId }: NotificationBellProps) {
	const [notifications, setNotifications] = useState<Notification[]>([]);
	const [unreadCount, setUnreadCount] = useState(0);
	const [isLoading, setIsLoading] = useState(false);
	const [isOpen, setIsOpen] = useState(false);

	const fetchNotifications = async () => {
		setIsLoading(true);
		try {
			const { data, error } = await actions.notifications.getNotifications({
				limit: 10,
				offset: 0,
				unreadOnly: false,
			});

			if (!error && data) {
				setNotifications(data.data || []);
				setUnreadCount(data.unreadCount || 0);
			}
		} catch (error) {
			console.error('Error fetching notifications:', error);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchNotifications();
		// Refresh every 30 seconds
		const interval = setInterval(fetchNotifications, 30000);
		return () => clearInterval(interval);
	}, [userId]);

	useEffect(() => {
		if (isOpen) {
			fetchNotifications();
		}
	}, [isOpen]);

	const handleMarkAsRead = async (notificationId: number) => {
		try {
			const { error } = await actions.notifications.markAsRead({
				notificationId,
			});

			if (!error) {
				setNotifications((notifs) =>
					notifs.map((n) =>
						n.id === notificationId ? { ...n, read: true } : n,
					),
				);
				setUnreadCount((count) => Math.max(0, count - 1));
			}
		} catch (error) {
			console.error('Error marking notification as read:', error);
		}
	};

	const handleMarkAllAsRead = async () => {
		try {
			const { error } = await actions.notifications.markAllAsRead({});

			if (!error) {
				setNotifications((notifs) => notifs.map((n) => ({ ...n, read: true })));
				setUnreadCount(0);
			}
		} catch (error) {
			console.error('Error marking all as read:', error);
		}
	};

	const handleDelete = async (notificationId: number) => {
		try {
			const { error } = await actions.notifications.deleteNotification({
				notificationId,
			});

			if (!error) {
				setNotifications((notifs) =>
					notifs.filter((n) => n.id !== notificationId),
				);
				const deletedNotif = notifications.find((n) => n.id === notificationId);
				if (deletedNotif && !deletedNotif.read) {
					setUnreadCount((count) => Math.max(0, count - 1));
				}
			}
		} catch (error) {
			console.error('Error deleting notification:', error);
		}
	};

	const getTypeColor = (type: string) => {
		switch (type) {
			case 'error':
				return 'text-red-500';
			case 'warning':
				return 'text-yellow-500';
			case 'success':
				return 'text-primary';
			default:
				return 'text-primary';
		}
	};

	return (
		<DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" size="icon" className="relative">
					<Bell className="size-5" />
					{unreadCount > 0 && (
						<Badge
							variant="destructive"
							className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full p-0 text-xs">
							{unreadCount > 9 ? '9+' : unreadCount}
						</Badge>
					)}
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align="end"
				className="w-80"
				sideOffset={8}
				style={{ zIndex: 1000 }}>
				<DropdownMenuHeader>
					<div className="flex items-center justify-between">
						<DropdownMenuLabel>Notifications</DropdownMenuLabel>
						{unreadCount > 0 && (
							<Button
								variant="ghost"
								size="sm"
								onClick={handleMarkAllAsRead}
								className="h-7 text-xs">
								Mark all as read
							</Button>
						)}
					</div>
					<DropdownMenuDescription>
						{unreadCount > 0
							? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
							: 'No unread notifications'}
					</DropdownMenuDescription>
				</DropdownMenuHeader>
				<DropdownMenuSeparator />
				<div className="max-h-[400px] overflow-y-auto">
					{isLoading ? (
						<div className="p-4 text-center text-sm text-muted-foreground">
							Loading notifications...
						</div>
					) : notifications.length === 0 ? (
						<div className="p-4 text-center text-sm text-muted-foreground">
							No notifications
						</div>
					) : (
						notifications.map((notification) => (
							<DropdownMenuItem
								key={notification.id}
								className={`flex flex-col items-start gap-1 p-3 ${!notification.read ? 'bg-muted/50' : ''}`}
								onClick={() =>
									!notification.read && handleMarkAsRead(notification.id)
								}>
								<div className="flex w-full items-start justify-between gap-2">
									<div className="flex-1">
										<div className="flex items-center gap-2">
											<span
												className={`font-medium ${getTypeColor(notification.type)}`}>
												{notification.title}
											</span>
											{!notification.read && (
												<span className="h-2 w-2 rounded-full bg-primary" />
											)}
										</div>
										<p className="text-xs text-muted-foreground mt-1">
											{notification.message}
										</p>
										<p className="text-xs text-muted-foreground mt-1">
											{new Date(notification.createdAt).toLocaleString()}
										</p>
									</div>
									<div className="flex items-center gap-1">
										{!notification.read && (
											<Button
												variant="ghost"
												size="icon"
												className="h-6 w-6"
												onClick={(e) => {
													e.stopPropagation();
													handleMarkAsRead(notification.id);
												}}>
												<Check className="size-3" />
											</Button>
										)}
										<Button
											variant="ghost"
											size="icon"
											className="h-6 w-6"
											onClick={(e) => {
												e.stopPropagation();
												handleDelete(notification.id);
											}}>
											<X className="size-3" />
										</Button>
									</div>
								</div>
							</DropdownMenuItem>
						))
					)}
				</div>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
