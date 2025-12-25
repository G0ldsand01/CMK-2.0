import { actions } from 'astro:actions';
import {
	CreditCard,
	Filter,
	LogIn,
	LogOut,
	RefreshCw,
	Shield,
	ShoppingCart,
	Trash2,
} from 'lucide-react';
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

type LogEntry = {
	id: string;
	timestamp: Date;
	event: string;
	userId: string;
	details: Record<string, unknown>;
	ip?: string | null;
	userAgent?: string | null;
	severity: 'info' | 'warning' | 'error' | 'success';
};

interface SecurityLogsViewerProps {
	initialLogs?: LogEntry[];
	totalLogs?: number;
}

const EVENT_TYPES = [
	{ value: 'all', label: 'All Events' },
	{ value: 'CART_ADD', label: 'Cart Add' },
	{ value: 'CART_REMOVE', label: 'Cart Remove' },
	{ value: 'CART_UPDATE', label: 'Cart Update' },
	{ value: 'ORDER_CREATED', label: 'Order Created' },
	{ value: 'PAYMENT_SUCCESS', label: 'Payment Success' },
	{ value: 'PAYMENT_FAILED', label: 'Payment Failed' },
	{ value: 'LOGIN', label: 'Login' },
	{ value: 'LOGOUT', label: 'Logout' },
	{ value: 'UNAUTHORIZED_ACCESS', label: 'Unauthorized Access' },
];

const getEventIcon = (event: string) => {
	const eventUpper = event.toUpperCase();
	if (eventUpper.includes('CART')) {
		return <ShoppingCart className="size-4" />;
	}
	if (eventUpper.includes('PAYMENT') || eventUpper.includes('ORDER')) {
		return <CreditCard className="size-4" />;
	}
	if (eventUpper.includes('LOGIN')) {
		return <LogIn className="size-4" />;
	}
	if (eventUpper.includes('LOGOUT')) {
		return <LogOut className="size-4" />;
	}
	return <Shield className="size-4" />;
};

export default function SecurityLogsViewer({
	initialLogs = [],
	totalLogs = 0,
}: SecurityLogsViewerProps) {
	// Convert timestamp strings back to Date objects
	const processedInitialLogs = initialLogs.map((log) => ({
		...log,
		timestamp:
			log.timestamp instanceof Date
				? log.timestamp
				: typeof log.timestamp === 'string'
					? new Date(log.timestamp)
					: new Date(),
	}));

	const [logs, setLogs] = useState<LogEntry[]>(processedInitialLogs);
	const [searchQuery, setSearchQuery] = useState('');
	const [eventType, setEventType] = useState<string>('');
	const [isLoading, setIsLoading] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [logToDelete, setLogToDelete] = useState<LogEntry | null>(null);
	const [currentPage, setCurrentPage] = useState(1);
	const [total, setTotal] = useState(totalLogs);

	const itemsPerPage = 50;
	const totalPages = Math.ceil(total / itemsPerPage);

	const getSeverityBadge = (severity: string) => {
		switch (severity) {
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

	const fetchLogs = useCallback(
		async (page: number = 1, search: string = '', type: string = 'all') => {
			setIsLoading(true);
			try {
				const params: {
					limit: number;
					offset: number;
					search?: string;
					eventType?: string;
				} = {
					limit: itemsPerPage,
					offset: (page - 1) * itemsPerPage,
				};

				if (search?.trim()) {
					params.search = search.trim();
				}

				if (type && type !== 'all' && type.trim()) {
					params.eventType = type.trim();
				}

				const { data, error } = await actions.admin.logs.getLogs(params);

				if (!error && data) {
					setLogs(data.data || []);
					setTotal(data.total || 0);
				} else if (error) {
					console.error('Error fetching logs:', error);
				}
			} catch (err) {
				console.error('Error fetching logs:', err);
			} finally {
				setIsLoading(false);
			}
		},
		[],
	);

	// Only fetch logs when page changes (not on initial mount if we have initial logs)
	useEffect(() => {
		// Don't fetch on initial mount if we're on page 1 with no filters
		// The initial logs are already loaded from the server
		if (currentPage === 1 && !searchQuery && eventType === 'all') {
			return;
		}

		// Fetch logs when page changes or filters are applied
		fetchLogs(currentPage, searchQuery, eventType === 'all' ? '' : eventType);
	}, [currentPage, searchQuery, eventType, fetchLogs]);

	const handleSearch = () => {
		setCurrentPage(1);
		fetchLogs(1, searchQuery, eventType);
	};

	const handleEventTypeChange = (value: string) => {
		setEventType(value);
		setCurrentPage(1);
		fetchLogs(1, searchQuery, value);
	};

	const handleDeleteLog = async () => {
		if (!logToDelete) return;

		setIsLoading(true);
		try {
			const { error } = await actions.admin.logs.deleteLog({
				logId: Number(logToDelete.id),
			});

			if (!error) {
				setDeleteDialogOpen(false);
				setLogToDelete(null);
				await fetchLogs(currentPage, searchQuery, eventType);
			} else {
				alert(error.message || 'Failed to delete log');
			}
		} catch (err) {
			console.error('Error deleting log:', err);
			alert('An error occurred while deleting the log');
		} finally {
			setIsLoading(false);
		}
	};

	const handlePageChange = (newPage: number) => {
		if (newPage >= 1 && newPage <= totalPages) {
			setCurrentPage(newPage);
		}
	};

	return (
		<div className="space-y-4 sm:space-y-6">
			<Card>
				<CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-4 sm:pb-6">
					<CardTitle className="text-lg sm:text-xl">Security Logs</CardTitle>
					<CardDescription className="text-sm">
						View security events and audit logs from the system
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4 px-4 sm:px-6 pb-4 sm:pb-6">
					<div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3 sm:gap-2">
						<div className="flex-1 space-y-2">
							<Label htmlFor="search" className="text-sm">
								Search Logs
							</Label>
							<Input
								id="search"
								placeholder="Search by event or user ID..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === 'Enter') {
										handleSearch();
									}
								}}
								className="text-sm sm:text-base"
							/>
						</div>
						<div className="w-full sm:w-48 space-y-2">
							<Label htmlFor="eventType" className="text-sm">
								<Filter className="size-3.5 inline mr-1" />
								Event Type
							</Label>
							<Select value={eventType} onValueChange={handleEventTypeChange}>
								<SelectTrigger id="eventType" className="text-sm sm:text-base">
									<SelectValue placeholder="All Events" />
								</SelectTrigger>
								<SelectContent>
									{EVENT_TYPES.map((type) => (
										<SelectItem key={type.value} value={type.value}>
											{type.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<Button
							onClick={handleSearch}
							className="mt-6 sm:mt-0 w-full sm:w-auto">
							<RefreshCw
								className={`size-4 mr-2 ${isLoading ? 'animate-spin' : ''}`}
							/>
							<span className="hidden sm:inline">Search</span>
							<span className="sm:hidden">Search</span>
						</Button>
					</div>

					{isLoading ? (
						<div className="text-center py-8 text-muted-foreground">
							Loading logs...
						</div>
					) : logs.length === 0 ? (
						<div className="text-center py-8 text-muted-foreground">
							No logs found
						</div>
					) : (
						<>
							<div className="space-y-2 sm:space-y-3">
								{logs.map((log) => (
									<div
										key={log.id}
										className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 border rounded-lg hover:bg-muted/50">
										<div className="shrink-0 mt-0.5">
											{getEventIcon(log.event)}
										</div>
										<div className="flex-1 space-y-1.5 sm:space-y-2 min-w-0">
											<div className="flex flex-col sm:flex-row sm:items-center gap-2">
												<div className="flex items-center gap-2 flex-wrap">
													<span className="font-medium text-sm sm:text-base break-words">
														{log.event}
													</span>
													{getSeverityBadge(log.severity)}
												</div>
												<Button
													variant="ghost"
													size="sm"
													className="ml-auto shrink-0"
													onClick={() => {
														setLogToDelete(log);
														setDeleteDialogOpen(true);
													}}>
													<Trash2 className="size-4 text-destructive" />
												</Button>
											</div>
											<div className="text-xs sm:text-sm text-muted-foreground flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
												<span>
													User: <span className="font-mono">{log.userId}</span>
												</span>
												<span className="hidden sm:inline">|</span>
												<span>{new Date(log.timestamp).toLocaleString()}</span>
											</div>
											{(log.ip || log.userAgent) && (
												<div className="flex flex-col gap-1 text-xs text-muted-foreground">
													{log.ip && (
														<span>
															IP: <span className="font-mono">{log.ip}</span>
														</span>
													)}
													{log.userAgent && (
														<span className="break-words">
															UA: {log.userAgent}
														</span>
													)}
												</div>
											)}
											{Object.keys(log.details || {}).length > 0 && (
												<div className="text-xs text-muted-foreground mt-2 p-2 sm:p-3 bg-muted rounded overflow-x-auto">
													<pre className="whitespace-pre-wrap text-xs">
														{JSON.stringify(log.details, null, 2)}
													</pre>
												</div>
											)}
										</div>
									</div>
								))}
							</div>

							{totalPages > 1 && (
								<div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0 pt-4 p-3 sm:p-0 rounded-md border sm:border-0 bg-muted/30 sm:bg-transparent">
									<div className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
										Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
										{Math.min(currentPage * itemsPerPage, total)} of {total}{' '}
										logs
									</div>
									<div className="flex items-center gap-2 w-full sm:w-auto">
										<Button
											variant="outline"
											size="sm"
											onClick={() => handlePageChange(currentPage - 1)}
											disabled={currentPage === 1 || isLoading}
											className="flex-1 sm:flex-initial">
											Previous
										</Button>
										<div className="text-xs sm:text-sm shrink-0">
											Page {currentPage} of {totalPages}
										</div>
										<Button
											variant="outline"
											size="sm"
											onClick={() => handlePageChange(currentPage + 1)}
											disabled={currentPage === totalPages || isLoading}
											className="flex-1 sm:flex-initial">
											Next
										</Button>
									</div>
								</div>
							)}
						</>
					)}
				</CardContent>
			</Card>

			<Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
				<DialogContent className="w-[95vw] sm:w-full max-w-md">
					<DialogHeader>
						<DialogTitle className="text-lg sm:text-xl">Delete Log</DialogTitle>
						<DialogDescription className="text-sm">
							Are you sure you want to delete this security log? This action
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
							onClick={handleDeleteLog}
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
