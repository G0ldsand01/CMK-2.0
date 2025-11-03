import { actions } from 'astro:actions';
import { CDN_URL } from 'astro:env/client';
import { useStore } from '@nanostores/react';
import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { type CartItem, setCart } from '@/lib/cart';
import { cn } from '@/lib/utils';
import { cartAtom } from '@/store';
import { Button } from '../ui/button';
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
					<SheetTitle className="text-2xl font-bold">Your Cart</SheetTitle>
					<SheetDescription>
						{Object.values($cart).length === 0 ? (
							<div className="flex flex-col items-center justify-center py-8">
								<p className="text-lg text-gray-500">Your cart is empty</p>
								<Button variant="outline" className="mt-4" asChild>
									<a href="/products">Continue Shopping</a>
								</Button>
							</div>
						) : (
							<>
								<div
									className="text-sm mb-4"
									style={{ color: 'var(--foreground)' }}>
									{Object.values($cart).length} items in your cart
								</div>
								<div className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto pr-2">
									{Object.values($cart).map((item) => (
										<div
											key={item.products.id}
											className="flex items-center gap-4 p-4 bg-card rounded-lg shadow-sm">
											<div
												className="w-20 h-20 rounded-md overflow-hidden"
												style={{ color: 'var(--foreground)' }}>
												<img
													src={`${CDN_URL}${item.products.image}`}
													alt={item.products.name}
													className="w-full h-full object-cover"
												/>
											</div>
											<div className="flex-1">
												<h3 className="font-medium">{item.products.name}</h3>
												<p
													className="text-sm"
													style={{ color: 'var(--foreground)' }}>
													${item.products.price}
												</p>
												<div className="flex items-center gap-2 mt-2">
													<Button
														variant="outline"
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
													<span className="w-8 text-center">
														{item.cart.quantity}
													</span>
													<Button
														variant="outline"
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
													<Button
														variant="ghost"
														size="icon"
														className="h-8 w-8 ml-auto text-destructive"
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
										</div>
									))}
								</div>
							</>
						)}
					</SheetDescription>
				</SheetHeader>
				{Object.values($cart).length > 0 && (
					<SheetFooter className="mt-auto pt-4 border-t">
						<div className="w-full">
							<div className="flex justify-between mb-4">
								<span className="text-foreground">Subtotal</span>
								<span
									className="font-medium"
									style={{ color: 'var(--foreground)' }}>
									${calculateTotal()}
								</span>
							</div>
							<Button className="w-full" asChild>
								<a href="/cart">
									<div className="flex items-center gap-2">
										<ShoppingBag /> Proceed to Checkout
									</div>
								</a>
							</Button>
						</div>
					</SheetFooter>
				)}
			</SheetContent>
		</Sheet>
	);
}
