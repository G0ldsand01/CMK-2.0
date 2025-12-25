import { actions } from 'astro:actions';
import { Trash2, Plus } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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

type Coupon = {
	id: string;
	name: string | null;
	code: string;
	percentOff: number | null;
	amountOff: number | null;
	currency: string | null;
	duration: 'once' | 'forever' | 'repeating';
	durationInMonths: number | null;
	maxRedemptions: number | null;
	timesRedeemed: number;
	valid: boolean;
	created: Date;
	redeemBy: Date | null;
};

interface CouponsTableProps {
	initialCoupons: Coupon[];
}

export default function CouponsTable({ initialCoupons }: CouponsTableProps) {
	const [coupons, setCoupons] = useState<Coupon[]>(initialCoupons);
	const [isLoading, setIsLoading] = useState(false);
	const [createDialogOpen, setCreateDialogOpen] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [couponToDelete, setCouponToDelete] = useState<Coupon | null>(null);
	const [formData, setFormData] = useState({
		id: '',
		name: '',
		percentOff: '',
		amountOff: '',
		currency: 'cad',
		duration: 'once' as 'once' | 'forever' | 'repeating',
		durationInMonths: '',
		maxRedemptions: '',
		redeemBy: '',
		discountType: 'percent' as 'percent' | 'amount',
	});

	const fetchCoupons = async () => {
		setIsLoading(true);
		try {
			const { data, error } = await actions.admin.coupons.getCoupons({
				limit: 100,
			});
			if (!error && data) {
				setCoupons(data.data || []);
			}
		} catch (error) {
			console.error('Error fetching coupons:', error);
		} finally {
			setIsLoading(false);
		}
	};

	const handleCreateCoupon = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);

		try {
			const couponData: any = {
				id: formData.id,
				duration: formData.duration,
			};

			if (formData.name) {
				couponData.name = formData.name;
			}

			if (formData.discountType === 'percent') {
				if (formData.percentOff) {
					couponData.percentOff = parseFloat(formData.percentOff);
				}
			} else {
				if (formData.amountOff) {
					couponData.amountOff = parseFloat(formData.amountOff);
					couponData.currency = formData.currency;
				}
			}

			if (formData.duration === 'repeating' && formData.durationInMonths) {
				couponData.durationInMonths = parseInt(formData.durationInMonths);
			}

			if (formData.maxRedemptions) {
				couponData.maxRedemptions = parseInt(formData.maxRedemptions);
			}

			if (formData.redeemBy) {
				couponData.redeemBy = formData.redeemBy;
			}

			const { error } = await actions.admin.coupons.createCoupon(couponData);

			if (!error) {
				setCreateDialogOpen(false);
				setFormData({
					id: '',
					name: '',
					percentOff: '',
					amountOff: '',
					currency: 'cad',
					duration: 'once',
					durationInMonths: '',
					maxRedemptions: '',
					redeemBy: '',
					discountType: 'percent',
				});
				await fetchCoupons();
			} else {
				alert(error.message || 'Failed to create coupon');
			}
		} catch (error) {
			alert('An error occurred while creating the coupon');
		} finally {
			setIsLoading(false);
		}
	};

	const handleDeleteCoupon = async () => {
		if (!couponToDelete) return;

		setIsLoading(true);
		try {
			const { error } = await actions.admin.coupons.deleteCoupon({
				couponId: couponToDelete.id,
			});

			if (!error) {
				setDeleteDialogOpen(false);
				setCouponToDelete(null);
				await fetchCoupons();
			} else {
				alert(error.message || 'Failed to delete coupon');
			}
		} catch (error) {
			alert('An error occurred while deleting the coupon');
		} finally {
			setIsLoading(false);
		}
	};

	const formatDiscount = (coupon: Coupon) => {
		if (coupon.percentOff) {
			return `${coupon.percentOff}% off`;
		} else if (coupon.amountOff && coupon.currency) {
			return `${coupon.currency.toUpperCase()} ${coupon.amountOff.toFixed(2)} off`;
		}
		return 'N/A';
	};

	const formatDuration = (coupon: Coupon) => {
		if (coupon.duration === 'once') return 'Once';
		if (coupon.duration === 'forever') return 'Forever';
		if (coupon.duration === 'repeating' && coupon.durationInMonths) {
			return `${coupon.durationInMonths} month${coupon.durationInMonths > 1 ? 's' : ''}`;
		}
		return coupon.duration;
	};

	return (
		<div className="space-y-4 sm:space-y-6">
			<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
				<h2 className="text-xl sm:text-2xl font-bold">Coupons</h2>
				<Button
					onClick={() => setCreateDialogOpen(true)}
					className="w-full sm:w-auto">
					<Plus className="size-4 mr-2" />
					Create Coupon
				</Button>
			</div>

			{/* Desktop Table View */}
			<div className="hidden md:block rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Code</TableHead>
							<TableHead>Name</TableHead>
							<TableHead>Discount</TableHead>
							<TableHead>Duration</TableHead>
							<TableHead>Redemptions</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Created</TableHead>
							<TableHead className="text-right">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{isLoading ? (
							<TableRow>
								<TableCell colSpan={8} className="text-center py-8">
									<div className="flex items-center justify-center">
										<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
										<span className="ml-2 text-muted-foreground">
											Loading...
										</span>
									</div>
								</TableCell>
							</TableRow>
						) : coupons.length === 0 ? (
							<TableRow>
								<TableCell colSpan={8} className="text-center py-8">
									<div className="flex flex-col items-center justify-center">
										<p className="text-muted-foreground">No coupons found</p>
										<Button
											variant="outline"
											size="sm"
											onClick={() => setCreateDialogOpen(true)}
											className="mt-4">
											<Plus className="size-4 mr-2" />
											Create Your First Coupon
										</Button>
									</div>
								</TableCell>
							</TableRow>
						) : (
							coupons.map((coupon) => (
								<TableRow key={coupon.id}>
									<TableCell>
										<Badge variant="outline" className="font-mono">
											{coupon.code}
										</Badge>
									</TableCell>
									<TableCell>{coupon.name || '-'}</TableCell>
									<TableCell>{formatDiscount(coupon)}</TableCell>
									<TableCell>{formatDuration(coupon)}</TableCell>
									<TableCell>
										{coupon.maxRedemptions
											? `${coupon.timesRedeemed} / ${coupon.maxRedemptions}`
											: coupon.timesRedeemed}
									</TableCell>
									<TableCell>
										<Badge variant={coupon.valid ? 'default' : 'secondary'}>
											{coupon.valid ? 'Valid' : 'Invalid'}
										</Badge>
									</TableCell>
									<TableCell>
										{new Date(coupon.created).toLocaleDateString()}
									</TableCell>
									<TableCell className="text-right">
										<Button
											variant="ghost"
											size="sm"
											type="button"
											onClick={(e) => {
												e.preventDefault();
												e.stopPropagation();
												setCouponToDelete(coupon);
												setDeleteDialogOpen(true);
											}}
											title="Delete Coupon">
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
			<div className="md:hidden space-y-3">
				{isLoading ? (
					<div className="flex items-center justify-center py-8">
						<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
						<span className="ml-2 text-muted-foreground">Loading...</span>
					</div>
				) : coupons.length === 0 ? (
					<div className="rounded-md border p-8 text-center">
						<p className="text-muted-foreground mb-4">No coupons found</p>
						<Button
							variant="outline"
							size="sm"
							onClick={() => setCreateDialogOpen(true)}
							className="w-full">
							<Plus className="size-4 mr-2" />
							Create Your First Coupon
						</Button>
					</div>
				) : (
					coupons.map((coupon) => (
						<div
							key={coupon.id}
							className="rounded-md border p-4 space-y-3 bg-card">
							<div className="flex items-start justify-between gap-2">
								<div className="flex-1 min-w-0">
									<Badge
										variant="outline"
										className="font-mono text-xs sm:text-sm mb-2">
										{coupon.code}
									</Badge>
									{coupon.name && (
										<p className="text-sm font-medium mt-1">{coupon.name}</p>
									)}
								</div>
								<Badge
									variant={coupon.valid ? 'default' : 'secondary'}
									className="shrink-0">
									{coupon.valid ? 'Valid' : 'Invalid'}
								</Badge>
							</div>
							<div className="grid grid-cols-2 gap-3 text-sm">
								<div>
									<p className="text-xs text-muted-foreground mb-1">Discount</p>
									<p className="font-medium">{formatDiscount(coupon)}</p>
								</div>
								<div>
									<p className="text-xs text-muted-foreground mb-1">Duration</p>
									<p className="font-medium">{formatDuration(coupon)}</p>
								</div>
								<div>
									<p className="text-xs text-muted-foreground mb-1">
										Redemptions
									</p>
									<p className="font-medium">
										{coupon.maxRedemptions
											? `${coupon.timesRedeemed} / ${coupon.maxRedemptions}`
											: coupon.timesRedeemed}
									</p>
								</div>
								<div>
									<p className="text-xs text-muted-foreground mb-1">Created</p>
									<p className="font-medium">
										{new Date(coupon.created).toLocaleDateString()}
									</p>
								</div>
							</div>
							<div className="flex justify-end pt-2 border-t">
								<Button
									variant="ghost"
									size="sm"
									type="button"
									onClick={(e) => {
										e.preventDefault();
										e.stopPropagation();
										setCouponToDelete(coupon);
										setDeleteDialogOpen(true);
									}}
									className="text-destructive hover:text-destructive hover:bg-destructive/10">
									<Trash2 className="size-4 mr-2" />
									Delete
								</Button>
							</div>
						</div>
					))
				)}
			</div>

			{/* Create Coupon Dialog */}
			<Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
				<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>Create Coupon</DialogTitle>
						<DialogDescription>
							Create a new coupon code for Stripe
						</DialogDescription>
					</DialogHeader>
					<form onSubmit={handleCreateCoupon} className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="id">Coupon Code *</Label>
							<Input
								id="id"
								value={formData.id}
								onChange={(e) =>
									setFormData({ ...formData, id: e.target.value })
								}
								placeholder="SUMMER2024"
								required
								maxLength={50}
							/>
							<p className="text-xs text-muted-foreground">
								This will be the code customers use. Only letters, numbers, and
								underscores.
							</p>
						</div>

						<div className="space-y-2">
							<Label htmlFor="name">Name (Optional)</Label>
							<Input
								id="name"
								value={formData.name}
								onChange={(e) =>
									setFormData({ ...formData, name: e.target.value })
								}
								placeholder="Summer Sale 2024"
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="discountType">Discount Type *</Label>
							<Select
								value={formData.discountType}
								onValueChange={(value: 'percent' | 'amount') =>
									setFormData({ ...formData, discountType: value })
								}>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="percent">Percentage Off</SelectItem>
									<SelectItem value="amount">Amount Off</SelectItem>
								</SelectContent>
							</Select>
						</div>

						{formData.discountType === 'percent' ? (
							<div className="space-y-2">
								<Label htmlFor="percentOff">Percentage Off *</Label>
								<Input
									id="percentOff"
									type="number"
									min="0"
									max="100"
									step="0.01"
									value={formData.percentOff}
									onChange={(e) =>
										setFormData({ ...formData, percentOff: e.target.value })
									}
									placeholder="10"
									required
								/>
							</div>
						) : (
							<>
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
									<div className="space-y-2">
										<Label htmlFor="amountOff">Amount Off *</Label>
										<Input
											id="amountOff"
											type="number"
											min="0"
											step="0.01"
											value={formData.amountOff}
											onChange={(e) =>
												setFormData({ ...formData, amountOff: e.target.value })
											}
											placeholder="10.00"
											required
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="currency">Currency *</Label>
										<Select
											value={formData.currency}
											onValueChange={(value) =>
												setFormData({ ...formData, currency: value })
											}>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="cad">CAD</SelectItem>
												<SelectItem value="usd">USD</SelectItem>
												<SelectItem value="eur">EUR</SelectItem>
											</SelectContent>
										</Select>
									</div>
								</div>
							</>
						)}

						<div className="space-y-2">
							<Label htmlFor="duration">Duration *</Label>
							<Select
								value={formData.duration}
								onValueChange={(value: 'once' | 'forever' | 'repeating') =>
									setFormData({ ...formData, duration: value })
								}>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="once">Once</SelectItem>
									<SelectItem value="forever">Forever</SelectItem>
									<SelectItem value="repeating">Repeating</SelectItem>
								</SelectContent>
							</Select>
						</div>

						{formData.duration === 'repeating' && (
							<div className="space-y-2">
								<Label htmlFor="durationInMonths">Duration in Months *</Label>
								<Input
									id="durationInMonths"
									type="number"
									min="1"
									max="12"
									value={formData.durationInMonths}
									onChange={(e) =>
										setFormData({
											...formData,
											durationInMonths: e.target.value,
										})
									}
									placeholder="3"
									required
								/>
							</div>
						)}

						<div className="space-y-2">
							<Label htmlFor="maxRedemptions">Max Redemptions (Optional)</Label>
							<Input
								id="maxRedemptions"
								type="number"
								min="1"
								value={formData.maxRedemptions}
								onChange={(e) =>
									setFormData({ ...formData, maxRedemptions: e.target.value })
								}
								placeholder="100"
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="redeemBy">Redeem By Date (Optional)</Label>
							<Input
								id="redeemBy"
								type="datetime-local"
								value={formData.redeemBy}
								onChange={(e) =>
									setFormData({ ...formData, redeemBy: e.target.value })
								}
							/>
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
								{isLoading ? 'Creating...' : 'Create Coupon'}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			{/* Delete Dialog */}
			<Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
				<DialogContent className="w-[95vw] sm:w-full">
					<DialogHeader>
						<DialogTitle className="text-lg sm:text-xl">
							Delete Coupon
						</DialogTitle>
						<DialogDescription className="text-sm">
							Are you sure you want to delete the coupon "{couponToDelete?.code}
							"? This action cannot be undone.
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
							onClick={handleDeleteCoupon}
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
