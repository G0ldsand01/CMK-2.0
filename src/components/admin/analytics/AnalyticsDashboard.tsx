import { actions } from 'astro:actions';
import {
	DollarSign,
	Users,
	Package,
	Star,
	ShoppingCart,
	TrendingUp,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';

type AnalyticsData = {
	revenue: {
		total: number;
		byMonth: Record<string, number>;
	};
	customers: {
		total: number;
	};
	products: {
		total: number;
	};
	reviews: {
		total: number;
		averageRating: number;
	};
	users: {
		total: number;
	};
	orders: {
		total: number;
	};
};

interface AnalyticsDashboardProps {
	initialData: AnalyticsData;
}

export default function AnalyticsDashboard({
	initialData,
}: AnalyticsDashboardProps) {
	const [data, setData] = useState<AnalyticsData>(initialData);
	const [isLoading, setIsLoading] = useState(false);

	const refreshData = async () => {
		setIsLoading(true);
		try {
			const { data: newData, error } =
				await actions.admin.analytics.getAnalytics({});
			if (!error && newData) {
				setData(newData);
			}
		} catch (error) {
			console.error('Error refreshing analytics:', error);
		} finally {
			setIsLoading(false);
		}
	};

	const stats = [
		{
			title: 'Total Revenue',
			value: `$${data.revenue?.total?.toFixed(2) || '0.00'}`,
			icon: DollarSign,
			description: 'Total revenue from all sales',
			color: 'text-primary',
			bgColor: 'bg-primary/10',
		},
		{
			title: 'Total Customers',
			value: data.customers?.total?.toString() || '0',
			icon: Users,
			description: 'Total number of customers',
			color: 'text-blue-600',
			bgColor: 'bg-blue-500/10',
		},
		{
			title: 'Total Products',
			value: data.products?.total?.toString() || '0',
			icon: Package,
			description: 'Products in catalog',
			color: 'text-purple-600',
			bgColor: 'bg-purple-500/10',
		},
		{
			title: 'Total Reviews',
			value: data.reviews?.total?.toString() || '0',
			icon: Star,
			description: `Average rating: ${data.reviews?.averageRating?.toFixed(1) || '0.0'}`,
			color: 'text-yellow-600',
			bgColor: 'bg-yellow-500/10',
		},
		{
			title: 'Total Users',
			value: data.users?.total?.toString() || '0',
			icon: Users,
			description: 'Registered users',
			color: 'text-indigo-600',
			bgColor: 'bg-indigo-500/10',
		},
		{
			title: 'Total Orders',
			value: data.orders?.total?.toString() || '0',
			icon: ShoppingCart,
			description: 'Total orders placed',
			color: 'text-orange-600',
			bgColor: 'bg-orange-500/10',
		},
	];

	return (
		<div className="space-y-6">
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{stats.map((stat) => {
					const Icon = stat.icon;
					return (
						<Card key={stat.title}>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">
									{stat.title}
								</CardTitle>
								<div className={`rounded-full p-2 ${stat.bgColor}`}>
									<Icon className={`size-4 ${stat.color}`} />
								</div>
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">{stat.value}</div>
								<p className="text-xs text-muted-foreground mt-1">
									{stat.description}
								</p>
							</CardContent>
						</Card>
					);
				})}
			</div>

			{data.revenue?.byMonth &&
				Object.keys(data.revenue.byMonth).length > 0 && (
					<Card>
						<CardHeader>
							<CardTitle>Revenue by Month</CardTitle>
							<CardDescription>Monthly revenue breakdown</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-2">
								{Object.entries(data.revenue.byMonth)
									.sort(([a], [b]) => a.localeCompare(b))
									.map(([month, amount]) => (
										<div
											key={month}
											className="flex items-center justify-between">
											<span className="text-sm font-medium">{month}</span>
											<Badge variant="outline">${amount.toFixed(2)}</Badge>
										</div>
									))}
							</div>
						</CardContent>
					</Card>
				)}
		</div>
	);
}
