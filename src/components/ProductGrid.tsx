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
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pt-24 sm:pt-30">
				{/* Header Section */}
				<div className="mb-6 sm:mb-8">
					<h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">
						{initialType === 'models' && 'Our 3D Models'}
						{initialType === 'iot' && 'Our IoT Products'}
						{initialType === 'tech' && 'Our Technology Products'}
						{initialType === 'products' && 'Our Products'}
						{!initialType && 'Our Products'}
					</h1>
					<p className="text-muted-foreground text-base sm:text-lg">
						{initialType === 'models' &&
							'Discover our collection of 3D printable models'}
						{initialType === 'iot' &&
							'Explore our IoT and smart device solutions'}
						{initialType === 'tech' &&
							'Browse our technology and electronic products'}
						{(initialType === 'products' || !initialType) &&
							'Discover our premium collection of customized peripherals'}
					</p>
				</div>

				<div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
					{/* Sidebar */}
					<aside className="w-full lg:w-72 shrink-0">
						<Card className="p-4 sm:p-6 lg:sticky lg:top-24">
							<div className="space-y-4 sm:space-y-6">
								{/* Search Section */}
								<div className="space-y-2 sm:space-y-3">
									<div className="flex items-center gap-2">
										<Search className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
										<h2 className="text-base sm:text-lg font-semibold">
											Search
										</h2>
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
											className="flex-1 text-sm sm:text-base"
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
								<div className="space-y-2 sm:space-y-3">
									<div className="flex items-center gap-2">
										<Filter className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
										<h2 className="text-base sm:text-lg font-semibold">
											Categories
										</h2>
									</div>
									<div className="space-y-1.5 sm:space-y-2">
										<Button
											variant={
												selectedCategory === null ? 'default' : 'outline'
											}
											onClick={() => handleCategoryFilter(null)}
											className="w-full justify-start text-sm sm:text-base">
											All Products
											{selectedCategory === null && (
												<Badge variant="secondary" className="ml-auto text-xs">
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
												className="w-full justify-start text-sm sm:text-base">
												{category.name}
												{selectedCategory === category.id && (
													<Badge
														variant="secondary"
														className="ml-auto text-xs">
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
							<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6">
								{productList.map((product) => (
									<ProductCard key={product.id} product={product} />
								))}
							</div>
						) : (
							<Card className="p-8 sm:p-12 text-center">
								<div className="space-y-4">
									<div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-muted mx-auto">
										<Search className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
									</div>
									<div>
										<h3 className="text-lg sm:text-xl font-semibold mb-2">
											No products found
										</h3>
										<p className="text-sm sm:text-base text-muted-foreground">
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
											className="mt-4 text-sm sm:text-base">
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
