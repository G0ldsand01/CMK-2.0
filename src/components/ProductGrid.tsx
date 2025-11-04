import { actions } from 'astro:actions';
import { Search } from 'lucide-react';
import { createContext, useCallback, useEffect, useState } from 'react';
import type {
	Category,
	Product,
	ProductType,
	ProductWithImages,
} from '@/store';
import ProductCard from './ProductCard';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface ProductGridProps {
	type?: ProductType;
}

export const ProductsContext = createContext<{
	products: Product[];
	categories: Category[];
}>({
	products: [],
	categories: [],
});

export default function ProductGrid({ type: initialType }: ProductGridProps) {
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
	const [productList, setProductList] = useState<ProductWithImages[]>([]);
	const [categories, setCategories] = useState<Category[]>([]);

	const handleSearch = useCallback(async () => {
		if (searchQuery) {
			const result = await actions.products.getProductsBySearch({
				search: searchQuery,
			});
			setProductList(result.data || []);
		} else {
			const result = await actions.products.getBestProducts();
			setProductList(result.data || []);
		}
	}, [searchQuery]);

	const handleCategoryFilter = useCallback(
		async (categoryId: number | null) => {
			setSelectedCategory(categoryId);
			if (categoryId) {
				const result = await actions.products.getProductsByCategory({
					categoryId,
				});
				setProductList(result.data || []);
			} else {
				const result = await actions.products.getBestProducts();
				setProductList(result.data || []);
			}
		},
		[],
	);

	// Load categories
	useEffect(() => {
		const loadCategories = async () => {
			const result = await actions.products.getCategories();
			setCategories(result.data || []);
		};
		loadCategories();
	}, []);

	// Load initial products based on type prop
	useEffect(() => {
		const loadInitialProducts = async () => {
			if (initialType) {
				const result = await actions.products.getProductsByType({
					type: initialType,
				});
				setProductList(result.data || []);
			} else {
				handleSearch();
			}
		};
		loadInitialProducts();
	}, [initialType, handleSearch]);

	return (
		<ProductsContext.Provider value={{ products: productList, categories }}>
			<div className="flex gap-6 p-4 max-w-7xl mx-auto px-1 py-8 pt-30">
				{/* Sidebar */}
				<div className="w-64 space-y-4">
					<div className="space-y-2">
						<h2 className="text-lg font-semibold">Search Products</h2>
						<div className="flex gap-2">
							<Input
								type="text"
								placeholder="Search products..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
							/>
							<Button onClick={handleSearch} size="icon">
								<Search className="h-4 w-4" />
							</Button>
						</div>
					</div>

					<div className="space-y-2">
						<h2 className="text-lg font-semibold">Categories</h2>
						<div className="space-y-2">
							<Button
								variant={selectedCategory === null ? 'default' : 'outline'}
								onClick={() => handleCategoryFilter(null)}
								className="w-full">
								All Categories
							</Button>
							{categories.map((category) => (
								<Button
									key={category.id}
									variant={
										selectedCategory === category.id ? 'default' : 'outline'
									}
									onClick={() => handleCategoryFilter(category.id)}
									className="w-full">
									{category.name}
								</Button>
							))}
						</div>
					</div>
				</div>

				{/* Product Grid */}
				<div className="flex-1">
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
						{productList.map((product) => (
							<ProductCard key={product.id} product={product} />
						))}
					</div>
				</div>
			</div>
		</ProductsContext.Provider>
	);
}
