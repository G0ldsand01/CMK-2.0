import { actions } from 'astro:actions';
import { ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
	Table,
	TableBody,
	TableCaption,
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

	if (error) {
		return (
			<div className="text-center text-red-500 p-4">
				<p>{error}</p>
				<Button
					variant="outline"
					onClick={() => handlePageChange(currentPage)}
					className="mt-4">
					Retry
				</Button>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Products</h1>
					<p className="text-muted-foreground">Manage your store products</p>
				</div>
				<AddProductForm
					categories={categories}
					types={types}
					onProductAdded={handleProductUpdated}
				/>
			</div>

			<Table>
				<TableCaption>A list of all products in your store.</TableCaption>
				<TableHeader>
					<TableRow>
						<TableHead className="w-[100px]">ID</TableHead>
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
							<TableCell colSpan={6} className="text-center">
								Loading...
							</TableCell>
						</TableRow>
					) : products.length === 0 ? (
						<TableRow>
							<TableCell colSpan={6} className="text-center">
								No products found
							</TableCell>
						</TableRow>
					) : (
						products.map((product) => (
							<TableRow key={product.id}>
								<TableCell className="font-medium">{product.id}</TableCell>
								<TableCell>{product.name}</TableCell>
								<TableCell>{product.category}</TableCell>
								<TableCell>{product.type}</TableCell>
								<TableCell className="text-right">
									${Number(product.price).toFixed(2)}
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
											onClick={() => handleDelete(product.id)}>
											<Trash2 className="h-4 w-4" />
										</Button>
									</div>
								</TableCell>
							</TableRow>
						))
					)}
				</TableBody>
			</Table>

			<div className="flex items-center justify-between">
				<div className="text-sm text-muted-foreground">
					Showing {products.length} of {totalProducts} products
				</div>
				<div className="flex items-center space-x-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => handlePageChange(currentPage - 1)}
						disabled={currentPage === 1 || isLoading}>
						<ChevronLeft className="h-4 w-4" />
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
						<ChevronRight className="h-4 w-4" />
					</Button>
				</div>
			</div>
		</div>
	);
}
