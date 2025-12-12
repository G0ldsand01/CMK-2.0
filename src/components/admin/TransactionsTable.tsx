import * as React from 'react';
import {
	ArrowUpDown,
	ArrowUp,
	ArrowDown,
	Search,
	X,
	Copy,
	CheckCircle2,
	XCircle,
	Clock,
	DollarSign,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type Transaction = {
	id: string;
	amount: number;
	currency: string;
	status: string;
	created: string; // ISO string
	createdFormatted: string;
	createdTime: string;
	customerName?: string;
	customerEmail?: string;
	last4?: string;
	brand?: string;
};

type SortField = 'date' | 'amount' | 'currency' | 'status' | null;
type SortDirection = 'asc' | 'desc';

interface TransactionsTableProps {
	transactions: Transaction[];
}

export function TransactionsTable({ transactions }: TransactionsTableProps) {
	const [searchQuery, setSearchQuery] = React.useState('');
	const [sortField, setSortField] = React.useState<SortField>(null);
	const [sortDirection, setSortDirection] =
		React.useState<SortDirection>('desc');

	const handleSort = (field: SortField) => {
		if (sortField === field) {
			setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
		} else {
			setSortField(field);
			setSortDirection('desc');
		}
	};

	const filteredAndSorted = React.useMemo(() => {
		let result = [...transactions];

		// Filter by search query
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			result = result.filter((tx) => {
				return (
					tx.id.toLowerCase().includes(query) ||
					tx.customerName?.toLowerCase().includes(query) ||
					tx.customerEmail?.toLowerCase().includes(query) ||
					tx.amount.toString().includes(query) ||
					tx.currency.toLowerCase().includes(query) ||
					tx.status.toLowerCase().includes(query) ||
					tx.last4?.includes(query) ||
					tx.brand?.toLowerCase().includes(query)
				);
			});
		}

		// Sort
		if (sortField) {
			result.sort((a, b) => {
				let comparison = 0;
				switch (sortField) {
					case 'date':
						comparison =
							new Date(a.created).getTime() - new Date(b.created).getTime();
						break;
					case 'amount':
						comparison = a.amount - b.amount;
						break;
					case 'currency':
						comparison = a.currency.localeCompare(b.currency);
						break;
					case 'status':
						comparison = a.status.localeCompare(b.status);
						break;
				}
				return sortDirection === 'asc' ? comparison : -comparison;
			});
		}

		return result;
	}, [transactions, searchQuery, sortField, sortDirection]);

	const getSortIcon = (field: SortField) => {
		if (sortField !== field) {
			return <ArrowUpDown className="size-3.5 text-muted-foreground" />;
		}
		return sortDirection === 'asc' ? (
			<ArrowUp className="size-3.5 text-primary" />
		) : (
			<ArrowDown className="size-3.5 text-primary" />
		);
	};

	const statusConfig = {
		succeeded: {
			icon: CheckCircle2,
			color: 'text-green-600 dark:text-green-400',
			bgColor: 'bg-green-500/10 dark:bg-green-500/20',
			badgeColor:
				'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20',
			label: 'Succeeded',
		},
		pending: {
			icon: Clock,
			color: 'text-yellow-600 dark:text-yellow-400',
			bgColor: 'bg-yellow-500/10 dark:bg-yellow-500/20',
			badgeColor:
				'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20',
			label: 'Pending',
		},
		failed: {
			icon: XCircle,
			color: 'text-red-600 dark:text-red-400',
			bgColor: 'bg-red-500/10 dark:bg-red-500/20',
			badgeColor:
				'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20',
			label: 'Failed',
		},
	};

	const copyToClipboard = (text: string) => {
		if (navigator.clipboard) {
			navigator.clipboard.writeText(text);
		}
	};

	return (
		<div className="space-y-4">
			{/* Search Bar */}
			<div className="flex items-center gap-2">
				<div className="relative flex-1">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
					<Input
						type="text"
						placeholder="Search by ID, customer name, email, amount, card number..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="pl-9 pr-9"
					/>
					{searchQuery && (
						<Button
							variant="ghost"
							size="sm"
							className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
							onClick={() => setSearchQuery('')}>
							<X className="size-4" />
						</Button>
					)}
				</div>
				{searchQuery && (
					<Badge variant="secondary" className="text-xs">
						{filteredAndSorted.length} result
						{filteredAndSorted.length !== 1 ? 's' : ''}
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
									onClick={() => handleSort(null)}>
									Transaction
								</Button>
							</TableHead>
							<TableHead className="h-12">
								<Button
									variant="ghost"
									size="sm"
									className="h-8 -ml-2 gap-1.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground"
									onClick={() => handleSort('amount')}>
									Amount
									{getSortIcon('amount')}
								</Button>
							</TableHead>
							<TableHead className="h-12">
								<Button
									variant="ghost"
									size="sm"
									className="h-8 -ml-2 gap-1.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground"
									onClick={() => handleSort('currency')}>
									Currency
									{getSortIcon('currency')}
								</Button>
							</TableHead>
							<TableHead className="h-12">
								<Button
									variant="ghost"
									size="sm"
									className="h-8 -ml-2 gap-1.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground"
									onClick={() => handleSort('status')}>
									Status
									{getSortIcon('status')}
								</Button>
							</TableHead>
							<TableHead className="h-12">
								<Button
									variant="ghost"
									size="sm"
									className="h-8 -ml-2 gap-1.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground"
									onClick={() => handleSort('date')}>
									Date & Time
									{getSortIcon('date')}
								</Button>
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{filteredAndSorted.length > 0 ? (
							filteredAndSorted.map((order) => {
								const config =
									statusConfig[order.status as keyof typeof statusConfig] ||
									statusConfig.pending;
								const StatusIcon = config.icon;

								return (
									<TableRow
										key={order.id}
										className="hover:bg-muted/30 transition-colors group">
										<TableCell className="px-6 py-4">
											<div className="flex flex-col gap-1.5">
												<div className="flex items-center gap-2">
													<code className="text-xs font-mono text-foreground font-medium">
														{order.id.slice(0, 12)}...{order.id.slice(-8)}
													</code>
													<Button
														variant="ghost"
														size="sm"
														className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
														onClick={() => copyToClipboard(order.id)}
														title="Copy ID">
														<Copy className="size-3 text-muted-foreground hover:text-foreground" />
													</Button>
												</div>
												{order.customerName && (
													<span className="text-xs text-muted-foreground">
														{order.customerName}
														{order.customerEmail && ` • ${order.customerEmail}`}
													</span>
												)}
												{order.last4 && (
													<span className="text-xs text-muted-foreground">
														{order.brand && `${order.brand} `}•••• {order.last4}
													</span>
												)}
											</div>
										</TableCell>
										<TableCell className="px-6 py-4">
											<div className="flex items-center gap-2">
												<DollarSign className="size-4 text-muted-foreground" />
												<span className="font-semibold text-base">
													{order.amount.toFixed(2)}
												</span>
											</div>
										</TableCell>
										<TableCell className="px-6 py-4">
											<Badge variant="outline" className="font-mono text-xs">
												{order.currency}
											</Badge>
										</TableCell>
										<TableCell className="px-6 py-4">
											<Badge
												variant="outline"
												className={`${config.badgeColor} border flex items-center gap-1.5 w-fit`}>
												<StatusIcon className={`size-3 ${config.color}`} />
												<span className="capitalize">{config.label}</span>
											</Badge>
										</TableCell>
										<TableCell className="px-6 py-4">
											<div className="flex flex-col">
												<span className="text-sm font-medium text-foreground">
													{order.createdFormatted}
												</span>
												<span className="text-xs text-muted-foreground">
													{order.createdTime}
												</span>
											</div>
										</TableCell>
									</TableRow>
								);
							})
						) : (
							<TableRow>
								<TableCell colSpan={5} className="px-6 py-12 text-center">
									<div className="flex flex-col items-center gap-3">
										<div className="rounded-full bg-muted p-3">
											<Search className="size-6 text-muted-foreground" />
										</div>
										<div>
											<p className="text-sm font-semibold text-foreground">
												{searchQuery
													? 'No transactions found'
													: 'No transactions'}
											</p>
											<p className="text-xs text-muted-foreground mt-1">
												{searchQuery
													? 'Try adjusting your search query'
													: 'Transactions will appear here once payment intents are processed'}
											</p>
										</div>
									</div>
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
