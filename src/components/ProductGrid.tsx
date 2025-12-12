import { actions } from 'astro:actions';
import { Filter, Search, X } from 'lucide-react';
import { createContext, useCallback, useEffect, useState } from 'react';
import type {
	Category,
	Product,
	ProductType,
	ProductWithImages,
} from '@/store';
import ProductCard from './ProductCard';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card } from './ui/card';
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
			<div className="max-w-7xl mx-auto px-4 py-8 pt-30">
				{/* Header Section */}
				<div className="mb-8">
					<h1 className="text-4xl font-bold tracking-tight mb-2">
						Our Products
					</h1>
					<p className="text-muted-foreground text-lg">
						Discover our premium collection of customized peripherals
					</p>
				</div>

				<div className="flex flex-col lg:flex-row gap-8">
					{/* Sidebar */}
					<aside className="lg:w-72 shrink-0">
						<Card className="p-6 sticky top-24">
							<div className="space-y-6">
								{/* Search Section */}
								<div className="space-y-3">
									<div className="flex items-center gap-2">
										<Search className="h-5 w-5 text-muted-foreground" />
										<h2 className="text-lg font-semibold">Search</h2>
									</div>
									<div className="flex gap-2">
										<Input
											type="text"
											placeholder="Search products..."
											value={searchQuery}
											onChange={(e) => setSearchQuery(e.target.value)}
											onKeyDown={(e) => {
												if (e.key === 'Enter') {
													handleSearch();
												}
											}}
											className="flex-1"
										/>
										<Button
											onClick={handleSearch}
											size="icon"
											className="shrink-0">
											<Search className="h-4 w-4" />
										</Button>
									</div>
								</div>

								{/* Divider */}
								<div className="border-t" />

								{/* Categories Section */}
								<div className="space-y-3">
									<div className="flex items-center gap-2">
										<Filter className="h-5 w-5 text-muted-foreground" />
										<h2 className="text-lg font-semibold">Categories</h2>
									</div>
									<div className="space-y-2">
										<Button
											variant={
												selectedCategory === null ? 'default' : 'outline'
											}
											onClick={() => handleCategoryFilter(null)}
											className="w-full justify-start">
											All Products
											{selectedCategory === null && (
												<Badge variant="secondary" className="ml-auto">
													{productList.length}
												</Badge>
											)}
										</Button>
										{categories.map((category) => (
											<Button
												key={category.id}
												variant={
													selectedCategory === category.id
														? 'default'
														: 'outline'
												}
												onClick={() => handleCategoryFilter(category.id)}
												className="w-full justify-start">
												{category.name}
												{selectedCategory === category.id && (
													<Badge variant="secondary" className="ml-auto">
														{productList.length}
													</Badge>
												)}
											</Button>
										))}
									</div>
								</div>
							</div>
						</Card>
					</aside>

					{/* Product Grid */}
					<div className="flex-1 min-w-0">
						{productList.length > 0 ? (
							<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
								{productList.map((product) => (
									<ProductCard key={product.id} product={product} />
								))}
							</div>
						) : (
							<Card className="p-12 text-center">
								<div className="space-y-4">
									<div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mx-auto">
										<Search className="h-8 w-8 text-muted-foreground" />
									</div>
									<div>
										<h3 className="text-xl font-semibold mb-2">
											No products found
										</h3>
										<p className="text-muted-foreground">
											Try adjusting your search or filter criteria
										</p>
									</div>
									{(searchQuery || selectedCategory !== null) && (
										<Button
											variant="outline"
											onClick={() => {
												setSearchQuery('');
												handleCategoryFilter(null);
											}}
											className="mt-4">
											<X className="h-4 w-4 mr-2" />
											Clear filters
										</Button>
									)}
								</div>
							</Card>
						)}
					</div>
				</div>
			</div>
		</ProductsContext.Provider>
	);
}
