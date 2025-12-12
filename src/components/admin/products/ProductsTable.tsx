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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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

	const handleDelete = async (productId: number) => {
		// Implement delete functionality
		console.log('Delete product:', productId);
	};

	const handleProductUpdated = async () => {
		// Refresh the current page to show updated data
		await fetchProducts(currentPage);
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
		<div className="space-y-6">
			{/* Statistics Cards */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<Card>
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-muted-foreground">Total Products</p>
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
								<p className="text-sm text-muted-foreground">Total Value</p>
								<p className="text-2xl font-bold">
									${stats.totalValue.toFixed(2)}
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
								<p className="text-sm text-muted-foreground">Showing</p>
								<p className="text-2xl font-bold">{filteredProducts.length}</p>
							</div>
							<Package className="size-8 text-muted-foreground" />
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Filters and Add Button */}
			<Card>
				<CardContent className="p-4">
					<div className="flex flex-col sm:flex-row gap-4">
						<div className="relative flex-1">
							<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground" />
							<Input
								placeholder="Search products by name, description, or ID..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="pl-10"
							/>
						</div>
						<div className="flex items-center gap-2">
							<Filter className="size-4 text-muted-foreground" />
							<Select value={categoryFilter} onValueChange={setCategoryFilter}>
								<SelectTrigger className="w-[150px]">
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
								<SelectTrigger className="w-[150px]">
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
						<p className="text-muted-foreground text-center">
							{searchQuery || categoryFilter !== 'all' || typeFilter !== 'all'
								? 'Try adjusting your search or filter criteria'
								: 'Add your first product to get started'}
						</p>
					</CardContent>
				</Card>
			) : (
				<Card>
					<CardHeader>
						<CardTitle>Products</CardTitle>
						<CardDescription>
							Showing {filteredProducts.length} of {totalProducts} products
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead className="w-[80px]">ID</TableHead>
									<TableHead>Name</TableHead>
									<TableHead>Category</TableHead>
									<TableHead>Type</TableHead>
									<TableHead className="text-right">Price</TableHead>
									<TableHead className="text-right">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{isLoading ? (
									<TableRow>
										<TableCell colSpan={6} className="text-center py-8">
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
														onClick={() => handleDelete(product.id)}
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
					</CardContent>
				</Card>
			)}

			{/* Pagination */}
			{totalPages > 1 && (
				<Card>
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div className="text-sm text-muted-foreground">
								Page {currentPage} of {totalPages} • Showing {products.length}{' '}
								of {totalProducts} products
							</div>
							<div className="flex items-center gap-2">
								<Button
									variant="outline"
									size="sm"
									onClick={() => handlePageChange(currentPage - 1)}
									disabled={currentPage === 1 || isLoading}>
									<ChevronLeft className="h-4 w-4" />
									Previous
								</Button>
								<Button
									variant="outline"
									size="sm"
									onClick={() => handlePageChange(currentPage + 1)}
									disabled={currentPage === totalPages || isLoading}>
									Next
									<ChevronRight className="h-4 w-4" />
								</Button>
							</div>
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
