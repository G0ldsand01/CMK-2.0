import { setCart } from '@/lib/cart';
import { cn } from '@/lib/utils';
import { cartAtom } from '@/store';
import { useStore } from '@nanostores/react';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
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
	newCart: {
		products: {
			id: number;
			name: string;
			price: string;
			description: string;
			image: string;
			category: string;
		};
		cart: {
			id: number;
			userId: string;
			productId: number;
			quantity: number;
		};
	}[];
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

	return (
		<Sheet
			onOpenChange={(open) => {
				if (open && !isFirstOpen) {
					setIsFirstOpen(true);
					setCart(newCart);
				}
			}}
		>
			<SheetTrigger>
				<Button variant={variant} className={cn(classes)}>
					{children}
				</Button>
			</SheetTrigger>
			<SheetContent
				className="w-full sm:max-w-lg"
				style={{
					zIndex: 1000,
				}}
			>
				<SheetHeader>
					<SheetTitle className="text-2xl font-bold">Your Cart</SheetTitle>
					<SheetDescription>
						{Object.values($cart).length === 0 ? (
							<div className="flex flex-col items-center justify-center py-8">
								<p className="text-lg text-gray-500">Your cart is empty</p>
								<Button variant="outline" className="mt-4">
									Continue Shopping
								</Button>
							</div>
						) : (
							<>
								<div className="text-sm text-gray-500 mb-4">
									{Object.values($cart).length} items in your cart
								</div>
								<div className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto pr-2">
									{Object.values($cart).map((item) => (
										<div
											key={item.products.id}
											className="flex items-center gap-4 p-4 bg-card rounded-lg shadow-sm"
										>
											<div className="w-20 h-20 rounded-md overflow-hidden bg-gray-100">
												<img
													src={`/api/image/${item.products.image}.png`}
													alt={item.products.name}
													className="w-full h-full object-cover"
												/>
											</div>
											<div className="flex-1">
												<h3 className="font-medium">{item.products.name}</h3>
												<p className="text-sm text-gray-500">
													${item.products.price}
												</p>
												<div className="flex items-center gap-2 mt-2">
													<Button
														variant="outline"
														size="icon"
														className="h-8 w-8"
													>
														<Minus className="h-4 w-4" />
													</Button>
													<span className="w-8 text-center">
														{item.cart.quantity}
													</span>
													<Button
														variant="outline"
														size="icon"
														className="h-8 w-8"
													>
														<Plus className="h-4 w-4" />
													</Button>
													<Button
														variant="ghost"
														size="icon"
														className="h-8 w-8 ml-auto text-destructive"
													>
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
								<span className="text-gray-500">Subtotal</span>
								<span className="font-medium">${calculateTotal()}</span>
							</div>
							<Button className="w-full">Proceed to Checkout</Button>
						</div>
					</SheetFooter>
				)}
			</SheetContent>
		</Sheet>
	);
}
