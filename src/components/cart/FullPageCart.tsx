import { actions } from 'astro:actions';
import { CDN_URL } from 'astro:env/client';
import { useStore } from '@nanostores/react';
import {
	ArrowRight,
	DollarSign,
	Minus,
	Package,
	Plus,
	ShoppingBag,
	Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { type CartItem, setCart } from '@/lib/cart';
import { cartAtom } from '@/store';
import { Button } from '../ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '../ui/card';
import { Separator } from '../ui/separator';

function FullPageCart({
	newCart,
}: React.PropsWithChildren<{
	newCart: CartItem[];
}>) {
	const $cart = useStore(cartAtom);
	const [isFirstLoad, setIsFirstLoad] = useState(false);

	if (!isFirstLoad) {
		setIsFirstLoad(true);
		setCart(newCart);
	}

	if (Object.values($cart).length === 0) return null;

	const calculateTotal = () => {
		return Object.values($cart)
			.reduce((total, item) => {
				return (
					total + Number.parseFloat(item.products.price) * item.cart.quantity
				);
			}, 0)
			.toFixed(2);
	};

	return (
		<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
			{/* Cart Items */}
			<div className="lg:col-span-2 space-y-4">
				{Object.values($cart).map((item) => {
					const imageUrl = item.image ? `${CDN_URL}/${item.image}` : null;
					const itemTotal = item.cart.quantity * Number(item.products.price);

					return (
						<Card
							key={item.products.id}
							className="overflow-hidden hover:shadow-lg transition-shadow">
							<CardContent className="p-4">
								<div className="flex flex-col sm:flex-row gap-4">
									{/* Product Image */}
									<div className="w-full sm:w-32 h-32 rounded-lg overflow-hidden bg-gradient-to-br from-muted/50 to-muted/30 flex items-center justify-center shrink-0 border border-border/50">
										{imageUrl ? (
											<img
												src={imageUrl}
												alt={item.products.name}
												className="w-full h-full object-contain p-3"
											/>
										) : (
											<Package className="size-12 text-muted-foreground" />
										)}
									</div>

									{/* Product Info */}
									<div className="flex-1 min-w-0">
										<h3 className="text-lg font-semibold mb-1">
											{item.products.name}
										</h3>
										{item.products.description && (
											<p className="text-sm text-muted-foreground mb-2 line-clamp-2">
												{item.products.description}
											</p>
										)}
										<div className="flex items-center gap-4 text-sm mb-3">
											<span className="text-muted-foreground">
												Unit Price:{' '}
												<span className="font-medium text-foreground">
													${Number(item.products.price).toFixed(2)}
												</span>
											</span>
										</div>

										{/* Quantity Controls */}
										<div className="flex items-center gap-3">
											<div className="flex items-center gap-2 border rounded-md">
												<Button
													variant="ghost"
													size="icon"
													className="h-8 w-8"
													onClick={async () => {
														const { data, error } =
															await actions.cart.updateCartItem({
																productId: item.products.id.toString(),
																decrement: true,
															});

														if (!error) {
															setCart(data.cart);
														}
													}}>
													<Minus className="h-4 w-4" />
												</Button>
												<span className="w-10 text-center font-medium">
													{item.cart.quantity}
												</span>
												<Button
													variant="ghost"
													size="icon"
													className="h-8 w-8"
													onClick={async () => {
														const { data, error } =
															await actions.cart.updateCartItem({
																productId: item.products.id.toString(),
																increment: true,
															});

														if (!error) {
															setCart(data.cart);
														}
													}}>
													<Plus className="h-4 w-4" />
												</Button>
											</div>
											<Button
												variant="ghost"
												size="icon"
												className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
												onClick={async () => {
													const { data, error } =
														await actions.cart.deleteCartItem({
															productId: item.products.id.toString(),
														});

													if (!error) {
														setCart(data.cart);
													}
												}}>
												<Trash2 className="h-4 w-4" />
											</Button>
										</div>
									</div>

									{/* Item Total */}
									<div className="text-right">
										<p className="text-sm text-muted-foreground mb-1">
											Subtotal
										</p>
										<p className="text-xl font-bold text-primary">
											${itemTotal.toFixed(2)}
										</p>
									</div>
								</div>
							</CardContent>
						</Card>
					);
				})}
			</div>

			{/* Order Summary */}
			<div className="lg:col-span-1">
				<Card className="sticky top-4">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<ShoppingBag className="size-5" />
							Order Summary
						</CardTitle>
						<CardDescription>
							{Object.values($cart).length} item
							{Object.values($cart).length !== 1 ? 's' : ''} in your cart
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						{/* Summary Details */}
						<div className="space-y-3">
							<div className="flex items-center justify-between text-sm">
								<span className="text-muted-foreground">Subtotal</span>
								<span className="font-medium">${calculateTotal()}</span>
							</div>
							<div className="flex items-center justify-between text-sm">
								<span className="text-muted-foreground">Shipping</span>
								<span className="font-medium">Calculated at checkout</span>
							</div>
							<div className="flex items-center justify-between text-sm">
								<span className="text-muted-foreground">Tax</span>
								<span className="font-medium">Calculated at checkout</span>
							</div>
						</div>

						<Separator />

						{/* Total */}
						<div className="flex items-center justify-between">
							<span className="text-lg font-semibold flex items-center gap-2">
								<DollarSign className="size-5" />
								Total
							</span>
							<span className="text-2xl font-bold text-primary">
								${calculateTotal()}
							</span>
						</div>

						{/* Checkout Button */}
						<Button
							className="w-full gap-2"
							size="lg"
							onClick={async () => {
								const { data, error } = await actions.cart.checkout();
								if (!error && data && data.url) {
									window.location.href = data.url;
								} else {
									console.error('Error checking out:', error);
								}
							}}>
							Proceed to Checkout
							<ArrowRight className="size-4" />
						</Button>

						{/* Continue Shopping */}
						<a href="/products">
							<Button variant="outline" className="w-full gap-2">
								<ShoppingBag className="size-4" />
								Continue Shopping
							</Button>
						</a>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

export default FullPageCart;
