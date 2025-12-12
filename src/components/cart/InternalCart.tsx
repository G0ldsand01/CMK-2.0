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
import { useEffect, useState } from 'react';
import { type CartItem, setCart } from '@/lib/cart';
import { cn } from '@/lib/utils';
import { cartAtom } from '@/store';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from '../ui/sheet';

export default function InternalCart({
	children,
	newCart,
	classes,
	variant,
}: React.PropsWithChildren<{
	newCart: CartItem[];
	classes?: string;
	variant?:
		| 'outline'
		| 'default'
		| 'secondary'
		| 'ghost'
		| 'link'
		| 'destructive';
}>) {
	const $cart = useStore(cartAtom);
	const [isFirstOpen, setIsFirstOpen] = useState(false);

	const calculateTotal = () => {
		return Object.values($cart)
			.reduce((total, item) => {
				return (
					total + Number.parseFloat(item.products.price) * item.cart.quantity
				);
			}, 0)
			.toFixed(2);
	};

	useEffect(() => {
		if (!isFirstOpen) {
			setIsFirstOpen(true);
			setCart(newCart);
		}
	}, [isFirstOpen, newCart]);

	return (
		<Sheet>
			<SheetTrigger>
				<Button variant={variant} className={cn(classes)}>
					{children}
				</Button>
			</SheetTrigger>
			<SheetContent
				className="w-full sm:max-w-lg"
				style={{
					zIndex: 1000,
				}}>
				<SheetHeader>
					<SheetTitle className="text-2xl font-bold flex items-center gap-2">
						<ShoppingBag className="size-6" />
						Your Cart
					</SheetTitle>
					<SheetDescription>
						{Object.values($cart).length === 0 ? (
							<div className="flex flex-col items-center justify-center py-12">
								<Package className="size-16 text-muted-foreground mb-4" />
								<p className="text-lg font-medium mb-2">Your cart is empty</p>
								<p className="text-sm text-muted-foreground text-center mb-6 max-w-xs">
									Start adding items to your cart to see them here
								</p>
								<Button variant="outline" className="gap-2" asChild>
									<a href="/products">
										<ShoppingBag className="size-4" />
										Continue Shopping
									</a>
								</Button>
							</div>
						) : (
							<>
								<Badge variant="secondary" className="mb-4">
									{Object.values($cart).length} item
									{Object.values($cart).length !== 1 ? 's' : ''} in your cart
								</Badge>
								<div className="flex flex-col gap-3 max-h-[50vh] overflow-y-auto pr-2 scrollbar-hide">
									{Object.values($cart).map((item) => {
										const imageUrl = item.image
											? `${CDN_URL}/${item.image}`
											: null;
										const itemTotal =
											item.cart.quantity * Number(item.products.price);

										return (
											<div
												key={item.products.id}
												className="flex items-start gap-3 p-3 bg-card rounded-lg border border-border hover:bg-muted/50 transition-colors">
												{/* Product Image */}
												<div className="w-20 h-20 rounded-lg overflow-hidden bg-gradient-to-br from-muted/50 to-muted/30 flex items-center justify-center shrink-0 border border-border/50">
													{imageUrl ? (
														<img
															src={imageUrl}
															alt={item.products.name}
															className="w-full h-full object-contain p-2"
														/>
													) : (
														<Package className="size-8 text-muted-foreground" />
													)}
												</div>

												{/* Product Info */}
												<div className="flex-1 min-w-0">
													<h3 className="font-semibold text-sm mb-1 line-clamp-1">
														{item.products.name}
													</h3>
													<p className="text-xs text-muted-foreground mb-2">
														${Number(item.products.price).toFixed(2)} each
													</p>

													{/* Quantity Controls */}
													<div className="flex items-center gap-2">
														<div className="flex items-center gap-1 border rounded-md">
															<Button
																variant="ghost"
																size="icon"
																className="h-7 w-7"
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
																<Minus className="h-3 w-3" />
															</Button>
															<span className="w-8 text-center text-sm font-medium">
																{item.cart.quantity}
															</span>
															<Button
																variant="ghost"
																size="icon"
																className="h-7 w-7"
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
																<Plus className="h-3 w-3" />
															</Button>
														</div>
														<Button
															variant="ghost"
															size="icon"
															className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
															onClick={async () => {
																const { data, error } =
																	await actions.cart.deleteCartItem({
																		productId: item.products.id.toString(),
																	});

																if (!error) {
																	setCart(data.cart);
																}
															}}>
															<Trash2 className="h-3.5 w-3.5" />
														</Button>
													</div>
													<p className="text-sm font-semibold text-primary mt-2">
														${itemTotal.toFixed(2)}
													</p>
												</div>
											</div>
										);
									})}
								</div>
							</>
						)}
					</SheetDescription>
				</SheetHeader>
				{Object.values($cart).length > 0 && (
					<SheetFooter className="mt-auto pt-4 border-t flex-col gap-3">
						<div className="w-full space-y-2">
							<div className="flex items-center justify-between text-sm">
								<span className="text-muted-foreground">Subtotal</span>
								<span className="font-semibold text-lg text-primary">
									${calculateTotal()}
								</span>
							</div>
							<Separator />
							<div className="flex items-center justify-between">
								<span className="font-semibold flex items-center gap-1 text-primary">
									<DollarSign className="size-4" />
									Total
								</span>
								<span className="text-xl font-bold text-primary">
									${calculateTotal()}
								</span>
							</div>
						</div>
						<Button className="w-full gap-2" size="lg" asChild>
							<a href="/cart">
								Proceed to Checkout
								<ArrowRight className="size-4" />
							</a>
						</Button>
						<Button variant="outline" className="w-full gap-2" asChild>
							<a href="/products">
								<ShoppingBag className="size-4" />
								Continue Shopping
							</a>
						</Button>
					</SheetFooter>
				)}
			</SheetContent>
		</Sheet>
	);
}
