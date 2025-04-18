import { CDN_URL } from 'astro:env/client';
import type { Product } from '@/store';
import { ChevronRight, ShoppingCart, Tag } from 'lucide-react';
import { useContext } from 'react';
import { ProductsContext } from './ProductGrid';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card } from './ui/card';

export default function ProductCard({ product }: { product: Product }) {
	const { categories } = useContext(ProductsContext);
	const category = categories.find(
		(category) => category.id === product.category,
	);
	return (
		<Card className="overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.02]">
			<div className="product-image pb-4 p-4 overflow-hidden rounded-md">
				<img
					src={`${CDN_URL}${product.image}`}
					alt={product.name}
					width={200}
					height={200}
					className="w-full h-auto object-cover aspect-square"
				/>
			</div>
			<div className="product-info space-y-3 px-4 pb-4">
				{category && (
					<Badge variant="outline" className="flex items-center gap-1">
						<Tag className="h-3 w-3" />
						{category.name}
					</Badge>
				)}
				<h3 className="text-xl font-semibold">{product.name}</h3>
				<p className="text-sm text-muted-foreground line-clamp-2">
					{product.description}
				</p>
				<div className="product-price text-lg font-bold">
					${Number(product.price).toFixed(2)}
				</div>
				<a
					href={`/product/${product.id}`}
					data-astro-prefetch
					className="block"
				>
					<Button className="w-full font-bold py-2 px-4 rounded-md flex items-center justify-center gap-2">
						<ShoppingCart className="h-4 w-4" /> View Product{' '}
						<ChevronRight className="h-4 w-4" />
					</Button>
				</a>
			</div>
		</Card>
	);
}
