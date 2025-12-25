import { actions } from 'astro:actions';
import { CDN_URL } from 'astro:env/client';
import { ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import type { ProductWithImages } from '@/store';

interface SuggestedProductsProps {
	productId: number;
	categoryId: number;
	productType: string;
}

export default function SuggestedProducts({
	productId,
	categoryId,
	productType,
}: SuggestedProductsProps) {
	const [suggestedProducts, setSuggestedProducts] = useState<
		ProductWithImages[]
	>([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const loadSuggestions = async () => {
			setIsLoading(true);
			try {
				const { data, error } = await actions.products.getSuggestedProducts({
					productId,
					categoryId,
					type: productType || undefined,
					limit: 4,
				});

				if (!error && data) {
					setSuggestedProducts(data);
				}
			} catch (error) {
				console.error('Error loading suggested products:', error);
			} finally {
				setIsLoading(false);
			}
		};

		loadSuggestions();
	}, [productId, categoryId, productType]);

	if (isLoading) {
		return (
			<div className="mt-12">
				<Card className="shadow-lg">
					<CardHeader>
						<CardTitle className="text-2xl">You might also like</CardTitle>
						<CardDescription>
							Discover similar products that might interest you
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
							{Array.from({ length: 4 }, () => Math.random().toString(36)).map(
								(key) => (
									<div
										key={key}
										className="h-64 bg-muted animate-pulse rounded-lg"
									/>
								),
							)}
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	if (suggestedProducts.length === 0) {
		return null;
	}

	return (
		<div className="mt-12">
			<Card className="shadow-lg">
				<CardHeader>
					<CardTitle className="text-2xl">You might also like</CardTitle>
					<CardDescription>
						Discover similar products that might interest you
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
						{suggestedProducts.map((product) => {
							const imageUrl = product.images?.[0]?.image
								? `${CDN_URL}/${product.images[0].image}`
								: `${CDN_URL}/placeholder.png`;
							return (
								<a
									key={product.id}
									href={`/product/${product.id}`}
									className="group block"
									data-astro-prefetch>
									<Card className="h-full overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1 border-border/50">
										<div className="relative aspect-square bg-gradient-to-br from-muted/50 to-muted/30 overflow-hidden">
											<img
												src={imageUrl}
												alt={product.name}
												className="w-full h-full object-contain p-4 transition-transform duration-500 group-hover:scale-110"
												loading="lazy"
												onError={(e) => {
													(e.target as HTMLImageElement).src =
														`${CDN_URL}/placeholder.png`;
												}}
											/>
										</div>
										<div className="p-4 space-y-2">
											<h3 className="font-semibold line-clamp-1 group-hover:text-primary transition-colors">
												{product.name}
											</h3>
											<p className="text-sm text-muted-foreground line-clamp-2">
												{product.description || ''}
											</p>
											<div className="flex items-center justify-between pt-2 border-t">
												<span className="text-lg font-bold text-primary">
													${Number(product.price).toFixed(2)}
												</span>
												<Button size="sm" variant="outline" className="gap-2">
													View
													<ArrowRight className="h-4 w-4" />
												</Button>
											</div>
										</div>
									</Card>
								</a>
							);
						})}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
