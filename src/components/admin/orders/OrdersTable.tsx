import {
	AlertCircle,
	Calendar,
	CheckCircle2,
	Clock,
	DollarSign,
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
			order.status.toLowerCase().includes(query);

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
		<div className="space-y-6">
			{/* Statistics Cards */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
				<Card>
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-muted-foreground">Total Orders</p>
								<p className="text-2xl font-bold">{stats.total}</p>
							</div>
							<Package className="size-8 text-muted-foreground" />
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-muted-foreground">Total Revenue</p>
								<p className="text-2xl font-bold">
									${stats.totalRevenue.toFixed(2)}
								</p>
							</div>
							<DollarSign className="size-8 text-muted-foreground" />
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-muted-foreground">Pending</p>
								<p className="text-2xl font-bold">{stats.pending}</p>
							</div>
							<Clock className="size-8 text-muted-foreground" />
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-muted-foreground">Completed</p>
								<p className="text-2xl font-bold">{stats.completed}</p>
							</div>
							<CheckCircle2 className="size-8 text-muted-foreground" />
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Filters */}
			<Card>
				<CardContent className="p-4">
					<div className="flex flex-col sm:flex-row gap-4">
						<div className="relative flex-1">
							<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground" />
							<Input
								placeholder="Search by order ID, customer name, email, or status..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="pl-10"
							/>
						</div>
						<div className="flex items-center gap-2">
							<Filter className="size-4 text-muted-foreground" />
							<Select value={statusFilter} onValueChange={setStatusFilter}>
								<SelectTrigger className="w-[180px]">
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
						<p className="text-muted-foreground text-center">
							{searchQuery || statusFilter !== 'all'
								? 'Try adjusting your search or filter criteria'
								: 'Orders will appear here when customers make purchases'}
						</p>
					</CardContent>
				</Card>
			) : (
				<div className="space-y-4">
					<div className="flex items-center justify-between mb-4">
						<p className="text-sm text-muted-foreground">
							Showing {filteredOrders.length} of {orders.length} orders
						</p>
					</div>
					{filteredOrders.map((order) => (
						<Card
							key={order.id}
							className="hover:shadow-lg transition-all duration-200 hover:border-primary/20">
							<CardHeader className="pb-4">
								<div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
									<div className="space-y-2">
										<div className="flex items-center gap-3 flex-wrap">
											<CardTitle className="text-xl font-bold">
												Order #{order.id}
											</CardTitle>
											<Badge
												variant={order.statusInfo.variant}
												className={`flex items-center gap-1.5 px-2.5 py-1 ${order.statusInfo.className || ''}`}>
												<StatusIcon statusInfo={order.statusInfo} />
												{order.statusInfo.label}
											</Badge>
										</div>
										<div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
											<CardDescription className="flex items-center gap-2 m-0">
												<Calendar className="size-4" />
												{new Date(order.createdAt).toLocaleDateString('en-US', {
													year: 'numeric',
													month: 'short',
													day: 'numeric',
													hour: '2-digit',
													minute: '2-digit',
												})}
											</CardDescription>
											{order.user && (
												<CardDescription className="flex items-center gap-2 m-0">
													<UserIcon className="size-4" />
													<span className="font-medium">{order.user.name}</span>
													<span className="text-muted-foreground">
														({order.user.email})
													</span>
												</CardDescription>
											)}
										</div>
									</div>
									<div className="flex items-center gap-2 text-2xl font-bold text-primary">
										<DollarSign className="size-6" />${order.total.toFixed(2)}
										<span className="text-sm font-normal text-muted-foreground ml-1">
											CAD
										</span>
									</div>
								</div>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="flex items-center gap-2 text-sm">
									<Package className="size-4 text-muted-foreground" />
									<span className="text-muted-foreground">
										{order.itemCount} item{order.itemCount !== 1 ? 's' : ''}
									</span>
								</div>

								{Array.isArray(order.cartJSON) && order.cartJSON.length > 0 && (
									<div className="space-y-2">
										<h4 className="text-sm font-semibold">Order Items:</h4>
										<div className="space-y-2">
											{order.cartJSON
												.slice(0, 3)
												.map((item: CartItem, idx: number) => {
													const itemKey = `${order.id}-item-${idx}-${item.products?.name || idx}`;
													return (
														<div
															key={itemKey}
															className="flex items-center justify-between text-sm p-3 rounded-lg bg-muted/50 border border-border/50">
															<span className="flex-1 font-medium">
																{item.products?.name || `Item ${idx + 1}`}
															</span>
															<div className="flex items-center gap-4">
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
												<p className="text-sm text-muted-foreground text-center pt-2">
													+{order.cartJSON.length - 3} more item
													{order.cartJSON.length - 3 !== 1 ? 's' : ''}
												</p>
											)}
										</div>
									</div>
								)}

								<div className="pt-4 border-t space-y-3">
									<div className="flex items-center justify-between text-sm">
										<span className="text-muted-foreground">
											Stripe Session ID:
										</span>
										<code className="text-xs bg-muted px-2.5 py-1 rounded-md font-mono border border-border">
											{order.stripeSessionId}
										</code>
									</div>
									<div className="flex items-center gap-2 pt-2">
										<a href={`/dashboard/admin/order/${order.id}`}>
											<Button variant="outline" size="sm" className="gap-2">
												<Eye className="size-4" />
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
													className="gap-2 border-yellow-500 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-950/20">
													<RefreshCw className="size-4" />
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
