import { actions } from 'astro:actions';
import { FileText, Download, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function ReportsManager() {
	const [isGenerating, setIsGenerating] = useState(false);
	const [salesReport, setSalesReport] = useState<any>(null);
	const [productReport, setProductReport] = useState<any>(null);

	const generateSalesReport = async () => {
		setIsGenerating(true);
		try {
			const { data, error } = await actions.admin.reports.generateSalesReport(
				{},
			);
			if (!error && data) {
				setSalesReport(data);
			} else {
				alert(error?.message || 'Failed to generate sales report');
			}
		} catch (error) {
			alert('An error occurred while generating the report');
		} finally {
			setIsGenerating(false);
		}
	};

	const generateProductReport = async () => {
		setIsGenerating(true);
		try {
			const { data, error } = await actions.admin.reports.generateProductReport(
				{},
			);
			if (!error && data) {
				setProductReport(data);
			} else {
				alert(error?.message || 'Failed to generate product report');
			}
		} catch (error) {
			alert('An error occurred while generating the report');
		} finally {
			setIsGenerating(false);
		}
	};

	const downloadReport = (report: any, type: string) => {
		const dataStr = JSON.stringify(report, null, 2);
		const dataBlob = new Blob([dataStr], { type: 'application/json' });
		const url = URL.createObjectURL(dataBlob);
		const link = document.createElement('a');
		link.href = url;
		link.download = `${type}-report-${new Date().toISOString()}.json`;
		link.click();
		URL.revokeObjectURL(url);
	};

	return (
		<div className="space-y-6">
			<div className="grid gap-4 md:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle>Sales Report</CardTitle>
						<CardDescription>
							Generate a report of all sales and revenue
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<Button onClick={generateSalesReport} disabled={isGenerating}>
							<RefreshCw
								className={`size-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`}
							/>
							{isGenerating ? 'Generating...' : 'Generate Sales Report'}
						</Button>
						{salesReport && (
							<div className="space-y-2">
								<div className="flex items-center justify-between">
									<span className="text-sm">
										{salesReport.revenue?.length || 0} revenue transactions
									</span>
									<Button
										variant="outline"
										size="sm"
										onClick={() => downloadReport(salesReport, 'sales')}>
										<Download className="size-4 mr-2" />
										Download
									</Button>
								</div>
								<div className="text-sm text-muted-foreground">
									{salesReport.orders?.length || 0} orders found
								</div>
							</div>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Product Report</CardTitle>
						<CardDescription>
							Generate a report of all products with reviews
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<Button onClick={generateProductReport} disabled={isGenerating}>
							<RefreshCw
								className={`size-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`}
							/>
							{isGenerating ? 'Generating...' : 'Generate Product Report'}
						</Button>
						{productReport && (
							<div className="space-y-2">
								<div className="flex items-center justify-between">
									<span className="text-sm">
										{productReport.products?.length || 0} products
									</span>
									<Button
										variant="outline"
										size="sm"
										onClick={() => downloadReport(productReport, 'product')}>
										<Download className="size-4 mr-2" />
										Download
									</Button>
								</div>
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
