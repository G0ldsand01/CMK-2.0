import { actions } from 'astro:actions';
import {
	Shield,
	AlertTriangle,
	CheckCircle,
	XCircle,
	Info,
	Trash2,
	RefreshCw,
} from 'lucide-react';
import { useState, useEffect } from 'react';
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

export default function SecurityLogsViewer({
	initialLogs = [],
	totalLogs = 0,
}: SecurityLogsViewerProps) {
	const [logs, setLogs] = useState<LogEntry[]>(initialLogs);
	const [searchQuery, setSearchQuery] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [logToDelete, setLogToDelete] = useState<LogEntry | null>(null);
	const [currentPage, setCurrentPage] = useState(1);
	const [total, setTotal] = useState(totalLogs);

	const itemsPerPage = 50;
	const totalPages = Math.ceil(total / itemsPerPage);

	const getSeverityIcon = (severity: string) => {
		switch (severity) {
			case 'error':
				return <XCircle className="size-4 text-red-500" />;
			case 'warning':
				return <AlertTriangle className="size-4 text-yellow-500" />;
			case 'success':
				return <CheckCircle className="size-4 text-green-500" />;
			default:
				return <Info className="size-4 text-blue-500" />;
		}
	};

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

	const fetchLogs = async (page: number = 1, search: string = '') => {
		setIsLoading(true);
		try {
			const { data, error } = await actions.admin.logs.getLogs({
				limit: itemsPerPage,
				offset: (page - 1) * itemsPerPage,
				search: search || undefined,
			});

			if (!error && data) {
				setLogs(data.data || []);
				setTotal(data.total || 0);
			}
		} catch (error) {
			console.error('Error fetching logs:', error);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchLogs(currentPage, searchQuery);
	}, [currentPage]);

	const handleSearch = () => {
		setCurrentPage(1);
		fetchLogs(1, searchQuery);
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
				await fetchLogs(currentPage, searchQuery);
			} else {
				alert(error.message || 'Failed to delete log');
			}
		} catch (error) {
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
		<div className="space-y-4">
			<Card>
				<CardHeader>
					<CardTitle>Security Logs</CardTitle>
					<CardDescription>
						View security events and audit logs from the system
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex items-center gap-2">
						<div className="flex-1 space-y-2">
							<Label htmlFor="search">Search Logs</Label>
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
							/>
						</div>
						<Button onClick={handleSearch} className="mt-6">
							<RefreshCw
								className={`size-4 mr-2 ${isLoading ? 'animate-spin' : ''}`}
							/>
							Search
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
							<div className="space-y-2">
								{logs.map((log) => (
									<div
										key={log.id}
										className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50">
										{getSeverityIcon(log.severity)}
										<div className="flex-1 space-y-1">
											<div className="flex items-center gap-2">
												<span className="font-medium">{log.event}</span>
												{getSeverityBadge(log.severity)}
												<Button
													variant="ghost"
													size="sm"
													className="ml-auto"
													onClick={() => {
														setLogToDelete(log);
														setDeleteDialogOpen(true);
													}}>
													<Trash2 className="size-4 text-destructive" />
												</Button>
											</div>
											<div className="text-sm text-muted-foreground">
												User: {log.userId} |{' '}
												{new Date(log.timestamp).toLocaleString()}
											</div>
											{log.ip && (
												<div className="text-xs text-muted-foreground">
													IP: {log.ip}
												</div>
											)}
											{log.userAgent && (
												<div className="text-xs text-muted-foreground">
													User Agent: {log.userAgent}
												</div>
											)}
											{Object.keys(log.details || {}).length > 0 && (
												<div className="text-xs text-muted-foreground mt-2 p-2 bg-muted rounded">
													<pre className="whitespace-pre-wrap">
														{JSON.stringify(log.details, null, 2)}
													</pre>
												</div>
											)}
										</div>
									</div>
								))}
							</div>

							{totalPages > 1 && (
								<div className="flex items-center justify-between pt-4">
									<div className="text-sm text-muted-foreground">
										Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
										{Math.min(currentPage * itemsPerPage, total)} of {total}{' '}
										logs
									</div>
									<div className="flex items-center gap-2">
										<Button
											variant="outline"
											size="sm"
											onClick={() => handlePageChange(currentPage - 1)}
											disabled={currentPage === 1 || isLoading}>
											Previous
										</Button>
										<div className="text-sm">
											Page {currentPage} of {totalPages}
										</div>
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
						</>
					)}
				</CardContent>
			</Card>

			<Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Delete Log</DialogTitle>
						<DialogDescription>
							Are you sure you want to delete this security log? This action
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
							onClick={handleDeleteLog}
							disabled={isLoading}>
							Delete
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
