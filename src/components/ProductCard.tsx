import { CDN_URL } from 'astro:env/client';
import { ArrowRight, Tag } from 'lucide-react';
import { useContext, useEffect, useState } from 'react';
import type { ProductWithImages } from '@/store';
import { ProductsContext } from './ProductGrid';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card } from './ui/card';

export default function ProductCard({
	product,
}: {
	product: ProductWithImages;
}) {
	const context = useContext(ProductsContext);
	const categories = context?.categories || [];
	const category = categories.find(
		(category) => category.id === product.category,
	);
	const [imageLoaded, setImageLoaded] = useState(false);
	const [hasError, setHasError] = useState(false);

	// Set imageLoaded to true if no image exists, CDN_URL is missing, or after a timeout
	useEffect(() => {
		// Reset states when product changes
		setImageLoaded(false);
		setHasError(false);

		const imagePath = product.images?.[0]?.image;

		if (!imagePath || !CDN_URL) {
			setImageLoaded(true);
			return;
		}

		// Fallback: if image doesn't load within 2 seconds, hide spinner
		const timeout = setTimeout(() => {
			setImageLoaded(true);
		}, 2000);

		return () => clearTimeout(timeout);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [product.images?.[0]?.image]);

	return (
		<Card className="group overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 border-border/50">
			{/* Image Container */}
			<div className="relative aspect-square bg-gradient-to-br from-muted/50 to-muted/30 overflow-hidden">
				<div className="absolute inset-0 flex items-center justify-center p-6">
					{product.images?.[0]?.image && CDN_URL && !hasError ? (
						<img
							src={`${CDN_URL}/${product.images[0].image}`}
							alt={product.name}
							width={300}
							height={300}
							className={`w-full h-full object-contain transition-transform duration-500 group-hover:scale-110 ${
								imageLoaded ? 'opacity-100' : 'opacity-0'
							}`}
							onLoad={() => {
								setImageLoaded(true);
							}}
							onError={() => {
								setHasError(true);
								setImageLoaded(true);
							}}
							loading="lazy"
						/>
					) : null}
				</div>
				{!imageLoaded && product.images?.[0]?.image && CDN_URL && !hasError && (
					<div className="absolute inset-0 flex items-center justify-center bg-muted/20">
						<div className="h-12 w-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
					</div>
				)}
				{/* Category Badge Overlay */}
				{category && (
					<div className="absolute top-3 left-3">
						<Badge
							variant="secondary"
							className="bg-background/80 backdrop-blur-sm shadow-sm">
							<Tag className="h-3 w-3 mr-1" />
							{category.name}
						</Badge>
					</div>
				)}
				{/* Hover Overlay */}
				<div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors duration-300" />
			</div>

			{/* Content */}
			<div className="p-5 space-y-4">
				<div className="space-y-2">
					<h3 className="text-lg font-semibold line-clamp-1 group-hover:text-primary transition-colors">
						{product.name}
					</h3>
					<p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
						{product.description}
					</p>
				</div>

				{/* Price and CTA */}
				<div className="flex items-center justify-between pt-2 border-t">
					<div className="flex flex-col">
						<span className="text-xs text-muted-foreground">Price</span>
						<span className="text-2xl font-bold text-primary">
							${Number(product.price).toFixed(2)}
						</span>
					</div>
					<a
						href={`/product/${product.id}`}
						data-astro-prefetch
						className="shrink-0">
						<Button size="sm" className="gap-2 group/btn" variant="default">
							<span>View</span>
							<ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
						</Button>
					</a>
				</div>
			</div>
		</Card>
	);
}
