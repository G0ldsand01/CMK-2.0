import { actions } from 'astro:actions';
import {
	ChevronLeft,
	ChevronRight,
	DollarSign,
	Filter,
	Package,
	Search,
	Trash2,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
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
import { Switch } from '@/components/ui/switch';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import type { productsTable } from '@/db/schema';
import AddProductForm from './AddProductForm';
import EditProductForm from './EditProductForm';
import EditProductImageForm from './EditProductImageForm';

type Product = typeof productsTable.$inferSelect;

interface ProductsTableProps {
	initialProducts: Product[];
	totalProducts: number;
	categories: { id: number; name: string }[];
	types: string[];
}

export default function ProductsTable({
	initialProducts,
	totalProducts: initialTotalProducts,
	categories,
	types,
}: ProductsTableProps) {
	const [products, setProducts] = useState<Product[]>([]);
	const [currentPage, setCurrentPage] = useState(1);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [totalProducts, setTotalProducts] = useState(initialTotalProducts);
	const [searchQuery, setSearchQuery] = useState('');
	const [categoryFilter, setCategoryFilter] = useState<string>('all');
	const [typeFilter, setTypeFilter] = useState<string>('all');
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [productToDelete, setProductToDelete] = useState<Product | null>(null);
	const itemsPerPage = 10;

	const totalPages = Math.ceil(totalProducts / itemsPerPage);

	useEffect(() => {
		// Check if initialProducts is the entire response object
		if (
			initialProducts &&
			typeof initialProducts === 'object' &&
			'data' in initialProducts
		) {
			setProducts(
				Array.isArray(initialProducts.data) ? initialProducts.data : [],
			);
		}
		// Ensure products is always an array and set initial data
		else if (Array.isArray(initialProducts)) {
			setProducts(initialProducts);
		} else {
			setProducts([]);
			setError('Invalid products data received');
		}
	}, [initialProducts]);

	const fetchProducts = async (page: number) => {
		if (page < 1 || page > totalPages || isLoading) return;

		setIsLoading(true);
		setError(null);
		try {
			const { data, error } = await actions.admin.products.getProducts({
				limit: itemsPerPage,
				offset: (page - 1) * itemsPerPage,
			});

			if (!error) {
				setProducts(data.data);
				setCurrentPage(page);
				setTotalProducts(data.total);
			} else {
				setError('Failed to fetch products');
				setProducts([]);
			}
		} catch (error) {
			if (error instanceof Error) {
				setError(error.message);
			} else {
				setError('An error occurred while fetching products');
			}
			setProducts([]);
		} finally {
			setIsLoading(false);
		}
	};

	const handlePageChange = async (newPage: number) => {
		await fetchProducts(newPage);
	};

	const handleDeleteClick = (product: Product) => {
		setProductToDelete(product);
		setDeleteDialogOpen(true);
	};

	const handleDeleteConfirm = async () => {
		if (!productToDelete) return;

		try {
			const { error } = await actions.admin.products.deleteProduct({
				productId: productToDelete.id,
			});

			if (!error) {
				toast.success('Product deleted successfully');
				setDeleteDialogOpen(false);
				setProductToDelete(null);
				// Refresh the current page to show updated data
				await fetchProducts(currentPage);
			} else {
				toast.error(error.message || 'Failed to delete product');
			}
		} catch (error) {
			console.error('Error deleting product:', error);
			toast.error('An error occurred while deleting the product');
		}
	};

	const handleProductUpdated = async () => {
		// Refresh the current page to show updated data
		await fetchProducts(currentPage);
	};

	const handleToggleVisibility = async (
		product: Product,
		newVisible: boolean,
	) => {
		try {
			const { error } = await actions.admin.products.toggleProductVisibility({
				productId: product.id,
				visible: newVisible,
			});

			if (!error) {
				toast.success(
					`Product ${newVisible ? 'made visible' : 'hidden'} successfully`,
				);
				// Update local state immediately for better UX
				setProducts((prev) =>
					prev.map((p) =>
						p.id === product.id ? { ...p, visible: newVisible } : p,
					),
				);
			} else {
				toast.error(error.message || 'Failed to toggle product visibility');
			}
		} catch (error) {
			console.error('Error toggling product visibility:', error);
			toast.error('An error occurred while toggling product visibility');
		}
	};

	// Filter products based on search and filters
	const filteredProducts = products.filter((product) => {
		const query = searchQuery.toLowerCase();
		const matchesSearch =
			product.name.toLowerCase().includes(query) ||
			product.description?.toLowerCase().includes(query) ||
			product.id.toString().includes(query);

		const matchesCategory =
			categoryFilter === 'all' || product.category === categoryFilter;
		const matchesType = typeFilter === 'all' || product.type === typeFilter;

		return matchesSearch && matchesCategory && matchesType;
	});

	// Calculate statistics
	const stats = {
		total: totalProducts,
		totalValue: products.reduce((sum, p) => sum + Number(p.price || 0), 0),
		byCategory: categories.reduce(
			(acc, cat) => {
				acc[cat.name] = products.filter((p) => p.category === cat.name).length;
				return acc;
			},
			{} as Record<string, number>,
		),
	};

	if (error) {
		return (
			<Card>
				<CardContent className="flex flex-col items-center justify-center py-16">
					<p className="text-destructive mb-4">{error}</p>
					<Button
						variant="outline"
						onClick={() => handlePageChange(currentPage)}>
						Retry
					</Button>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="space-y-4 sm:space-y-6">
			{/* Statistics Cards */}
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
				<Card>
					<CardContent className="p-3 sm:p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-xs sm:text-sm text-muted-foreground">
									Total Products
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
									Total Value
								</p>
								<p className="text-xl sm:text-2xl font-bold">
									${stats.totalValue.toFixed(2)}
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
									Showing
								</p>
								<p className="text-xl sm:text-2xl font-bold">
									{filteredProducts.length}
								</p>
							</div>
							<Package className="size-6 sm:size-8 text-muted-foreground shrink-0" />
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Filters and Add Button */}
			<Card>
				<CardContent className="p-4">
					<div className="flex flex-col gap-4">
						<div className="relative flex-1">
							<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground" />
							<Input
								placeholder="Search products..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="pl-10"
							/>
						</div>
						<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
							<div className="flex items-center gap-2 flex-1">
								<Filter className="size-4 text-muted-foreground shrink-0" />
								<Select
									value={categoryFilter}
									onValueChange={setCategoryFilter}>
									<SelectTrigger className="flex-1 sm:w-[150px]">
										<SelectValue placeholder="Category" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">All Categories</SelectItem>
										{categories.map((cat) => (
											<SelectItem key={cat.id} value={cat.name}>
												{cat.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<Select value={typeFilter} onValueChange={setTypeFilter}>
									<SelectTrigger className="flex-1 sm:w-[150px]">
										<SelectValue placeholder="Type" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">All Types</SelectItem>
										{types.map((type) => (
											<SelectItem key={type} value={type}>
												{type.charAt(0).toUpperCase() + type.slice(1)}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<AddProductForm
								categories={categories}
								types={types}
								onProductAdded={handleProductUpdated}
							/>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Products Table */}
			{filteredProducts.length === 0 && !isLoading ? (
				<Card>
					<CardContent className="flex flex-col items-center justify-center py-16">
						<Package className="size-16 text-muted-foreground mb-4" />
						<h3 className="text-lg font-semibold mb-2">
							{searchQuery || categoryFilter !== 'all' || typeFilter !== 'all'
								? 'No products found'
								: 'No products yet'}
						</h3>
						<p className="text-muted-foreground text-center px-4">
							{searchQuery || categoryFilter !== 'all' || typeFilter !== 'all'
								? 'Try adjusting your search or filter criteria'
								: 'Add your first product to get started'}
						</p>
					</CardContent>
				</Card>
			) : (
				<Card>
					<CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6">
						<CardTitle className="text-lg sm:text-xl">Products</CardTitle>
						<CardDescription className="text-xs sm:text-sm">
							Showing {filteredProducts.length} of {totalProducts} products
						</CardDescription>
					</CardHeader>
					<CardContent className="p-0 sm:p-6">
						{/* Desktop Table View */}
						<div className="hidden md:block overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead className="w-[80px]">ID</TableHead>
										<TableHead>Name</TableHead>
										<TableHead>Category</TableHead>
										<TableHead>Type</TableHead>
										<TableHead className="text-right">Price</TableHead>
										<TableHead className="text-center">Visible</TableHead>
										<TableHead className="text-right">Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{isLoading ? (
										<TableRow>
											<TableCell colSpan={7} className="text-center py-8">
												<div className="flex items-center justify-center">
													<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
													<span className="ml-2 text-muted-foreground">
														Loading...
													</span>
												</div>
											</TableCell>
										</TableRow>
									) : (
										filteredProducts.map((product) => (
											<TableRow key={product.id} className="hover:bg-muted/50">
												<TableCell className="font-medium">
													{product.id}
												</TableCell>
												<TableCell>
													<div className="font-semibold">{product.name}</div>
													{product.description && (
														<div className="text-sm text-muted-foreground line-clamp-1">
															{product.description}
														</div>
													)}
												</TableCell>
												<TableCell>
													<Badge variant="secondary">{product.category}</Badge>
												</TableCell>
												<TableCell>
													<Badge variant="outline">{product.type}</Badge>
												</TableCell>
												<TableCell className="text-right">
													<span className="font-semibold text-primary">
														${Number(product.price || 0).toFixed(2)}
													</span>
												</TableCell>
												<TableCell className="text-center">
													<Switch
														checked={product.visible ?? true}
														onCheckedChange={(checked) =>
															handleToggleVisibility(product, checked)
														}
													/>
												</TableCell>
												<TableCell className="text-right">
													<div className="flex justify-end gap-2">
														<EditProductImageForm product={product} />
														<EditProductForm
															product={product}
															categories={categories}
															types={types}
															onProductUpdated={handleProductUpdated}
														/>
														<Button
															variant="ghost"
															size="icon"
															onClick={() => handleDeleteClick(product)}
															className="text-destructive hover:text-destructive hover:bg-destructive/10">
															<Trash2 className="h-4 w-4" />
														</Button>
													</div>
												</TableCell>
											</TableRow>
										))
									)}
								</TableBody>
							</Table>
						</div>

						{/* Mobile Card View */}
						<div className="md:hidden space-y-4 p-4">
							{isLoading ? (
								<div className="flex items-center justify-center py-8">
									<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
									<span className="ml-2 text-muted-foreground">Loading...</span>
								</div>
							) : (
								filteredProducts.map((product) => (
									<Card key={product.id} className="overflow-hidden">
										<CardContent className="p-4 space-y-4">
											<div className="flex items-start justify-between gap-2">
												<div className="flex-1 min-w-0">
													<div className="flex items-center gap-2 mb-2">
														<span className="text-xs font-medium text-muted-foreground">
															ID: {product.id}
														</span>
														<Badge variant="secondary" className="text-xs">
															{product.category}
														</Badge>
														<Badge variant="outline" className="text-xs">
															{product.type}
														</Badge>
													</div>
													<h3 className="font-semibold text-base mb-1 line-clamp-2">
														{product.name}
													</h3>
													{product.description && (
														<p className="text-sm text-muted-foreground line-clamp-2 mb-3">
															{product.description}
														</p>
													)}
												</div>
											</div>
											<div className="flex items-center justify-between pt-3 border-t">
												<div className="flex items-center gap-4">
													<div>
														<span className="text-xs text-muted-foreground block">
															Price
														</span>
														<span className="font-semibold text-primary text-lg">
															${Number(product.price || 0).toFixed(2)}
														</span>
													</div>
													<div>
														<span className="text-xs text-muted-foreground block mb-1">
															Visible
														</span>
														<Switch
															checked={product.visible ?? true}
															onCheckedChange={(checked) =>
																handleToggleVisibility(product, checked)
															}
														/>
													</div>
												</div>
											</div>
											<div className="flex items-center justify-end gap-2 pt-2 border-t">
												<EditProductImageForm product={product} />
												<EditProductForm
													product={product}
													categories={categories}
													types={types}
													onProductUpdated={handleProductUpdated}
												/>
												<Button
													variant="ghost"
													size="icon"
													onClick={() => handleDeleteClick(product)}
													className="text-destructive hover:text-destructive hover:bg-destructive/10">
													<Trash2 className="h-4 w-4" />
												</Button>
											</div>
										</CardContent>
									</Card>
								))
							)}
						</div>
					</CardContent>
				</Card>
			)}

			{/* Pagination */}
			{totalPages > 1 && (
				<Card>
					<CardContent className="p-4">
						<div className="flex flex-col sm:flex-row items-center justify-between gap-4">
							<div className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
								<span className="hidden sm:inline">
									Page {currentPage} of {totalPages} • Showing {products.length}{' '}
									of {totalProducts} products
								</span>
								<span className="sm:hidden">
									Page {currentPage} of {totalPages}
								</span>
							</div>
							<div className="flex items-center gap-2 w-full sm:w-auto">
								<Button
									variant="outline"
									size="sm"
									onClick={() => handlePageChange(currentPage - 1)}
									disabled={currentPage === 1 || isLoading}
									className="flex-1 sm:flex-initial">
									<ChevronLeft className="h-4 w-4" />
									<span className="hidden sm:inline ml-1">Previous</span>
								</Button>
								<Button
									variant="outline"
									size="sm"
									onClick={() => handlePageChange(currentPage + 1)}
									disabled={currentPage === totalPages || isLoading}
									className="flex-1 sm:flex-initial">
									<span className="hidden sm:inline mr-1">Next</span>
									<ChevronRight className="h-4 w-4" />
								</Button>
							</div>
						</div>
					</CardContent>
				</Card>
			)}

			{/* Delete Confirmation Dialog */}
			<Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Delete Product</DialogTitle>
						<DialogDescription>
							Are you sure you want to delete "{productToDelete?.name}"? This
							action cannot be undone and will permanently remove the product
							and all associated images.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => {
								setDeleteDialogOpen(false);
								setProductToDelete(null);
							}}>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={handleDeleteConfirm}
							disabled={isLoading}>
							Delete
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
