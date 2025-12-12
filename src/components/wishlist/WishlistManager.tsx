import { CDN_URL } from 'astro:env/client';
import { actions } from 'astro:actions';
import { useState } from 'react';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, ShoppingCart, Trash2, Package } from 'lucide-react';

type WishlistItem = {
	products: {
		id: number;
		name: string;
		description: string | null;
		price: string;
		thumbnail: string | null;
	};
};

interface WishlistManagerProps {
	wishlist: WishlistItem[];
}

export default function WishlistManager({
	wishlist: initialWishlist,
}: WishlistManagerProps) {
	const [wishlist, setWishlist] = useState<WishlistItem[]>(initialWishlist);
	const [removing, setRemoving] = useState<number | null>(null);

	const handleRemove = async (productId: number) => {
		setRemoving(productId);
		try {
			const { error } = await actions.user.toggleProductFromWishlist({
				productId: productId.toString(),
			});

			if (!error) {
				setWishlist((prev) =>
					prev.filter((item) => item.products.id !== productId),
				);
			} else {
				alert('Failed to remove item from wishlist');
			}
		} catch (error) {
			console.error('Error removing from wishlist:', error);
			alert('An error occurred while removing the item');
		} finally {
			setRemoving(null);
		}
	};

	if (wishlist.length === 0) {
		return (
			<Card>
				<CardContent className="flex flex-col items-center justify-center py-16">
					<Heart className="size-16 text-muted-foreground mb-4" />
					<h3 className="text-lg font-semibold mb-2">Your wishlist is empty</h3>
					<p className="text-muted-foreground text-center mb-6">
						Start adding products you love to your wishlist!
					</p>
					<a href="/products">
						<Button>
							<ShoppingCart className="size-4 mr-2" />
							Browse Products
						</Button>
					</a>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
			{wishlist.map((item) => {
				const product = item.products;
				// Use CDN_URL with thumbnail path, or fallback to placeholder
				// thumbnail can be a full path starting with / or just a filename
				let imageUrl = `${CDN_URL}/placeholder.png`;
				if (product.thumbnail) {
					if (
						product.thumbnail.startsWith('http://') ||
						product.thumbnail.startsWith('https://')
					) {
						// Already a full URL
						imageUrl = product.thumbnail;
					} else if (product.thumbnail.startsWith('/')) {
						// Path starting with /
						imageUrl = `${CDN_URL}${product.thumbnail}`;
					} else {
						// Just a filename, add /
						imageUrl = `${CDN_URL}/${product.thumbnail}`;
					}
				}

				return (
					<Card
						key={product.id}
						className="group hover:shadow-lg transition-shadow">
						<a href={`/product/${product.id}`} className="block">
							<div className="relative aspect-square overflow-hidden rounded-t-lg bg-muted">
								<img
									src={imageUrl}
									alt={product.name}
									className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
									onError={(e) => {
										// Fallback to placeholder if image fails to load
										e.currentTarget.src = `${CDN_URL}/placeholder.png`;
									}}
								/>
							</div>
						</a>
						<CardHeader>
							<div className="flex items-start justify-between gap-2">
								<div className="flex-1 min-w-0">
									<CardTitle className="text-lg line-clamp-2 mb-1">
										<a
											href={`/product/${product.id}`}
											className="hover:text-primary transition-colors">
											{product.name}
										</a>
									</CardTitle>
									<CardDescription className="line-clamp-2 text-sm">
										{product.description || 'No description available'}
									</CardDescription>
								</div>
							</div>
						</CardHeader>
						<CardContent>
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									<span className="text-2xl font-bold">${product.price}</span>
								</div>
								<Button
									variant="ghost"
									size="sm"
									onClick={(e) => {
										e.preventDefault();
										handleRemove(product.id);
									}}
									disabled={removing === product.id}
									className="text-destructive hover:text-destructive hover:bg-destructive/10">
									{removing === product.id ? (
										<>
											<Package className="size-4 mr-2 animate-spin" />
											Removing...
										</>
									) : (
										<>
											<Trash2 className="size-4 mr-2" />
											Remove
										</>
									)}
								</Button>
							</div>
							<div className="mt-4">
								<a href={`/product/${product.id}`}>
									<Button className="w-full" variant="outline">
										<ShoppingCart className="size-4 mr-2" />
										View Product
									</Button>
								</a>
							</div>
						</CardContent>
					</Card>
				);
			})}
		</div>
	);
}
