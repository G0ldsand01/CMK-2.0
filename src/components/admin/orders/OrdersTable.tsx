import {
	AlertCircle,
	Calendar,
	CheckCircle2,
	Clock,
	DollarSign,
	Download,
	Eye,
	Filter,
	Package,
	RefreshCw,
	Search,
	User as UserIcon,
	XCircle,
} from 'lucide-react';
import { useState } from 'react';
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';

type CartItem = {
	products?: {
		name?: string;
		price?: string | number;
	};
	cart?: {
		quantity?: number;
	};
};

type Order = {
	id: number;
	userId: string;
	stripeSessionId: string;
	status: string;
	cartJSON: CartItem[];
	createdAt: Date;
	user: {
		id: string;
		name: string;
		email: string;
	} | null;
	total: number;
	itemCount: number;
	statusInfo: {
		variant: 'default' | 'secondary' | 'destructive' | 'outline';
		iconName: string;
		label: string;
		className?: string;
	};
	orderType?: 'normal' | '3dprint';
	_3dPrintDetails?: {
		filename: string;
		material: string;
		color: string;
		infill: number | null;
		volumeCm3: string | number | null;
		printer: string | null;
		fileUrl: string | null;
	};
};

interface OrdersTableProps {
	orders: Order[];
}

export default function OrdersTable({
	orders: initialOrders,
}: OrdersTableProps) {
	const [orders, setOrders] = useState<Order[]>(initialOrders);
	const [searchQuery, setSearchQuery] = useState('');
	const [statusFilter, setStatusFilter] = useState<string>('all');
	const [refundDialogOpen, setRefundDialogOpen] = useState(false);
	const [orderToRefund, setOrderToRefund] = useState<Order | null>(null);
	const [isProcessing, setIsProcessing] = useState(false);
	const [refundError, setRefundError] = useState<string | null>(null);

	const filteredOrders = orders.filter((order) => {
		const query = searchQuery.toLowerCase();
		const matchesSearch =
			order.id.toString().includes(query) ||
			order.user?.name?.toLowerCase().includes(query) ||
			order.user?.email?.toLowerCase().includes(query) ||
			order.stripeSessionId.toLowerCase().includes(query) ||
			order.status.toLowerCase().includes(query) ||
			(order.orderType === '3dprint' &&
				order._3dPrintDetails?.filename?.toLowerCase().includes(query)) ||
			(order.orderType === '3dprint' &&
				order._3dPrintDetails?.material?.toLowerCase().includes(query)) ||
			(order.orderType === '3dprint' &&
				order._3dPrintDetails?.color?.toLowerCase().includes(query));

		const matchesStatus =
			statusFilter === 'all' ||
			order.status.toLowerCase() === statusFilter.toLowerCase();

		return matchesSearch && matchesStatus;
	});

	// Calculate statistics
	const stats = {
		total: orders.length,
		totalRevenue: orders.reduce((sum, order) => sum + order.total, 0),
		pending: orders.filter((o) => o.status.toLowerCase() === 'pending').length,
		completed: orders.filter(
			(o) =>
				o.status.toLowerCase() === 'completed' ||
				o.status.toLowerCase() === 'paid',
		).length,
	};

	const handleRefund = async () => {
		if (!orderToRefund) return;

		setIsProcessing(true);
		setRefundError(null);

		try {
			const response = await fetch(`/api/orders/${orderToRefund.id}/refund`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
			});

			const data = await response.json();

			if (!response.ok) {
				// Create a more detailed error message
				const errorMsg = data.error || 'Failed to process refund';
				throw new Error(
					JSON.stringify({ error: errorMsg, details: data.details }),
				);
			}

			// Update the order status in the local state
			setOrders((prevOrders) =>
				prevOrders.map((order) =>
					order.id === orderToRefund.id
						? {
								...order,
								status: 'refunded',
								statusInfo: {
									variant: 'outline',
									iconName: 'RefreshCw',
									label: 'Refunded',
									className: 'border-yellow-500 text-yellow-500',
								},
							}
						: order,
				),
			);

			setRefundDialogOpen(false);
			setOrderToRefund(null);
		} catch (error) {
			let errorMessage = 'An error occurred';
			if (error instanceof Error) {
				errorMessage = error.message;
				// Try to parse JSON error if it's a fetch error
				try {
					const errorData = JSON.parse(error.message);
					if (errorData.error) {
						errorMessage = errorData.error;
						if (errorData.details) {
							errorMessage += ` (${errorData.details})`;
						}
					}
				} catch {
					// Not JSON, use the message as is
				}
			}
			setRefundError(errorMessage);
		} finally {
			setIsProcessing(false);
		}
	};

	// Icon mapping
	const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
		CheckCircle2,
		Clock,
		XCircle,
		RefreshCw,
		AlertCircle,
	};

	const StatusIcon = ({ statusInfo }: { statusInfo: Order['statusInfo'] }) => {
		const Icon = iconMap[statusInfo.iconName] || AlertCircle;
		return <Icon className="size-3" />;
	};

	return (
		<div className="space-y-4 sm:space-y-6">
			{/* Statistics Cards */}
			<div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
				<Card>
					<CardContent className="p-3 sm:p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-xs sm:text-sm text-muted-foreground">
									Total Orders
								</p>
								<p className="text-xl sm:text-2xl font-bold">{stats.total}</p>
							</div>
							<Package className="size-6 sm:size-8 text-muted-foreground shrink-0" />
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="p-3 sm:p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-xs sm:text-sm text-muted-foreground">
									Total Revenue
								</p>
								<p className="text-xl sm:text-2xl font-bold">
									${stats.totalRevenue.toFixed(2)}
								</p>
							</div>
							<DollarSign className="size-6 sm:size-8 text-muted-foreground shrink-0" />
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="p-3 sm:p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-xs sm:text-sm text-muted-foreground">
									Pending
								</p>
								<p className="text-xl sm:text-2xl font-bold">{stats.pending}</p>
							</div>
							<Clock className="size-6 sm:size-8 text-muted-foreground shrink-0" />
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="p-3 sm:p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-xs sm:text-sm text-muted-foreground">
									Completed
								</p>
								<p className="text-xl sm:text-2xl font-bold">
									{stats.completed}
								</p>
							</div>
							<CheckCircle2 className="size-6 sm:size-8 text-muted-foreground shrink-0" />
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Filters */}
			<Card>
				<CardContent className="p-4">
					<div className="flex flex-col gap-4">
						<div className="relative flex-1">
							<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground" />
							<Input
								placeholder="Search orders..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="pl-10"
							/>
						</div>
						<div className="flex items-center gap-2">
							<Filter className="size-4 text-muted-foreground shrink-0" />
							<Select value={statusFilter} onValueChange={setStatusFilter}>
								<SelectTrigger className="flex-1 sm:w-[180px]">
									<SelectValue placeholder="Filter by status" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Status</SelectItem>
									<SelectItem value="pending">Pending</SelectItem>
									<SelectItem value="completed">Completed</SelectItem>
									<SelectItem value="paid">Paid</SelectItem>
									<SelectItem value="cancelled">Cancelled</SelectItem>
									<SelectItem value="refunded">Refunded</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Orders List */}
			{filteredOrders.length === 0 ? (
				<Card>
					<CardContent className="flex flex-col items-center justify-center py-16">
						<Package className="size-16 text-muted-foreground mb-4" />
						<h3 className="text-lg font-semibold mb-2">
							{searchQuery || statusFilter !== 'all'
								? 'No orders found'
								: 'No orders yet'}
						</h3>
						<p className="text-muted-foreground text-center px-4">
							{searchQuery || statusFilter !== 'all'
								? 'Try adjusting your search or filter criteria'
								: 'Orders will appear here when customers make purchases'}
						</p>
					</CardContent>
				</Card>
			) : (
				<div className="space-y-3 sm:space-y-4">
					<div className="flex items-center justify-between mb-2 sm:mb-4 px-1">
						<p className="text-xs sm:text-sm text-muted-foreground">
							Showing {filteredOrders.length} of {orders.length} orders
						</p>
					</div>
					{filteredOrders.map((order) => (
						<Card
							key={order.id}
							className="hover:shadow-lg transition-all duration-200 hover:border-primary/20">
							<CardHeader className="pb-3 sm:pb-4 px-4 sm:px-6 pt-4 sm:pt-6">
								<div className="flex flex-col gap-3 sm:gap-4">
									<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
										<div className="space-y-2 flex-1">
											<div className="flex items-center gap-2 sm:gap-3 flex-wrap">
												<CardTitle className="text-lg sm:text-xl font-bold">
													{order.orderType === '3dprint'
														? '3D Print Order'
														: 'Order'}{' '}
													#{order.id}
												</CardTitle>
												<Badge
													variant={order.statusInfo.variant}
													className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1 text-xs sm:text-sm ${order.statusInfo.className || ''}`}>
													<StatusIcon statusInfo={order.statusInfo} />
													{order.statusInfo.label}
												</Badge>
											</div>
											<div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
												<CardDescription className="flex items-center gap-2 m-0">
													<Calendar className="size-3 sm:size-4 shrink-0" />
													<span className="break-words">
														{new Date(order.createdAt).toLocaleDateString(
															'en-US',
															{
																year: 'numeric',
																month: 'short',
																day: 'numeric',
																hour: '2-digit',
																minute: '2-digit',
															},
														)}
													</span>
												</CardDescription>
												{order.user && (
													<CardDescription className="flex items-center gap-2 m-0">
														<UserIcon className="size-3 sm:size-4 shrink-0" />
														<span className="font-medium break-words">
															{order.user.name}
														</span>
														<span className="text-muted-foreground break-all">
															({order.user.email})
														</span>
													</CardDescription>
												)}
											</div>
										</div>
										<div className="flex items-center gap-2 text-xl sm:text-2xl font-bold text-primary shrink-0">
											<DollarSign className="size-5 sm:size-6" />$
											{order.total.toFixed(2)}
											<span className="text-xs sm:text-sm font-normal text-muted-foreground ml-1">
												CAD
											</span>
										</div>
									</div>
								</div>
							</CardHeader>
							<CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6 pb-4 sm:pb-6">
								<div className="flex items-center gap-2 text-xs sm:text-sm">
									<Package className="size-3 sm:size-4 text-muted-foreground shrink-0" />
									<span className="text-muted-foreground">
										{order.itemCount} item{order.itemCount !== 1 ? 's' : ''}
									</span>
								</div>

								{order.orderType === '3dprint' && order._3dPrintDetails ? (
									<div className="space-y-2">
										<div className="p-3 rounded-md bg-muted/50 border-l-4 border-l-primary">
											<p className="text-sm font-medium mb-2">3D Print Order</p>
											<div className="space-y-1 text-xs sm:text-sm">
												<p>
													<strong>File:</strong>{' '}
													{order._3dPrintDetails.filename}
												</p>
												<p>
													<strong>Material:</strong>{' '}
													{order._3dPrintDetails.material} -{' '}
													{order._3dPrintDetails.color}
												</p>
												{order._3dPrintDetails.infill && (
													<p>
														<strong>Infill:</strong>{' '}
														{order._3dPrintDetails.infill}%
													</p>
												)}
												{order._3dPrintDetails.printer && (
													<p>
														<strong>Printer:</strong>{' '}
														{order._3dPrintDetails.printer}
													</p>
												)}
												{order._3dPrintDetails.volumeCm3 && (
													<p>
														<strong>Volume:</strong>{' '}
														{Number(order._3dPrintDetails.volumeCm3).toFixed(1)}{' '}
														cm³
													</p>
												)}
											</div>
										</div>
									</div>
								) : (
									Array.isArray(order.cartJSON) &&
									order.cartJSON.length > 0 && (
										<div className="space-y-2">
											<h4 className="text-xs sm:text-sm font-semibold">
												Order Items:
											</h4>
											<div className="space-y-2">
												{order.cartJSON
													.slice(0, 3)
													.map((item: CartItem, idx: number) => {
														const itemKey = `${order.id}-item-${idx}-${item.products?.name || idx}`;
														return (
															<div
																key={itemKey}
																className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 text-xs sm:text-sm p-2 sm:p-3 rounded-lg bg-muted/50 border border-border/50">
																<span className="flex-1 font-medium break-words">
																	{item.products?.name || `Item ${idx + 1}`}
																</span>
																<div className="flex items-center gap-3 sm:gap-4 shrink-0">
																	<span className="text-muted-foreground">
																		Qty: {item.cart?.quantity || 0}
																	</span>
																	{item.products?.price && (
																		<span className="font-semibold text-primary">
																			$
																			{(
																				Number(item.products.price) *
																				(item.cart?.quantity || 0)
																			).toFixed(2)}
																		</span>
																	)}
																</div>
															</div>
														);
													})}
												{order.cartJSON.length > 3 && (
													<p className="text-xs sm:text-sm text-muted-foreground text-center pt-2">
														+{order.cartJSON.length - 3} more item
														{order.cartJSON.length - 3 !== 1 ? 's' : ''}
													</p>
												)}
											</div>
										</div>
									)
								)}

								{/* Download button for 3D print orders */}
								{order.orderType === '3dprint' &&
									order._3dPrintDetails?.fileUrl && (
										<div className="pt-3 sm:pt-4 border-t">
											<a
												href={order._3dPrintDetails.fileUrl}
												target="_blank"
												rel="noopener noreferrer"
												className="inline-flex items-center gap-2 text-xs sm:text-sm text-primary hover:underline font-medium"
												onClick={(e) => e.stopPropagation()}>
												<Download className="size-3 sm:size-4" />
												Download 3D Model
											</a>
										</div>
									)}

								<div className="pt-3 sm:pt-4 border-t space-y-2 sm:space-y-3">
									<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs sm:text-sm">
										<span className="text-muted-foreground shrink-0">
											Stripe Session ID:
										</span>
										<code className="text-[10px] sm:text-xs bg-muted px-2 sm:px-2.5 py-1 rounded-md font-mono border border-border break-all">
											{order.stripeSessionId}
										</code>
									</div>
									<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2">
										<a
											href={`/dashboard/admin/order/${order.id}`}
											className="flex-1 sm:flex-initial">
											<Button
												variant="outline"
												size="sm"
												className="gap-2 w-full sm:w-auto">
												<Eye className="size-3 sm:size-4" />
												View Details
											</Button>
										</a>
										{order.status !== 'refunded' &&
											order.status !== 'cancelled' && (
												<Button
													variant="outline"
													size="sm"
													onClick={() => {
														setOrderToRefund(order);
														setRefundDialogOpen(true);
														setRefundError(null);
													}}
													className="gap-2 border-yellow-500 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-950/20 w-full sm:w-auto">
													<RefreshCw className="size-3 sm:size-4" />
													Refund
												</Button>
											)}
									</div>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			)}

			{/* Refund Dialog */}
			<Dialog open={refundDialogOpen} onOpenChange={setRefundDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Refund Order</DialogTitle>
						<DialogDescription>
							Are you sure you want to refund Order #{orderToRefund?.id}? This
							action cannot be undone. The customer will receive a full refund.
						</DialogDescription>
					</DialogHeader>
					{orderToRefund && (
						<div className="space-y-3 py-4">
							<div className="flex justify-between text-sm">
								<span className="text-muted-foreground">Order Total:</span>
								<span className="font-semibold">
									${orderToRefund.total.toFixed(2)} CAD
								</span>
							</div>
							{orderToRefund.user && (
								<div className="flex justify-between text-sm">
									<span className="text-muted-foreground">Customer:</span>
									<span>
										{orderToRefund.user.name} ({orderToRefund.user.email})
									</span>
								</div>
							)}
							{refundError && (
								<div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md border border-destructive/20">
									<p className="font-medium mb-1">Error processing refund:</p>
									<p className="text-xs">{refundError}</p>
									{refundError.includes('expired') ||
									refundError.includes('invalid') ? (
										<p className="text-xs mt-2 text-muted-foreground">
											Tip: You can process this refund manually in the Stripe
											dashboard using the Payment Intent ID.
										</p>
									) : null}
								</div>
							)}
						</div>
					)}
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => {
								setRefundDialogOpen(false);
								setOrderToRefund(null);
								setRefundError(null);
							}}
							disabled={isProcessing}>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={handleRefund}
							disabled={isProcessing}
							className="bg-yellow-500 hover:bg-yellow-600 text-white">
							{isProcessing ? 'Processing...' : 'Confirm Refund'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
