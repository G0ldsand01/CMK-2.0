import { actions } from 'astro:actions';
import { CDN_URL } from 'astro:env/client';
import { useStore } from '@nanostores/react';
import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { type CartItem, setCart } from '@/lib/cart';
import { cartAtom } from '@/store';
import { Button } from '../ui/button';

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
		<>
			{Object.values($cart).map((item) => {
				const imageUrl = item.image ? `${CDN_URL}/${item.image}` : null;

				return (
					<div
						key={item.products.id}
						className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 bg-[var(--muted)] p-4 rounded-lg shadow-sm my-4">
						<div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full">
							<div className="w-24 h-24 rounded-lg overflow-hidden bg-gradient-to-br from-muted/50 to-muted/30 flex items-center justify-center shrink-0 border border-border/50">
								{imageUrl ? (
									<img
										src={imageUrl}
										alt={item.products.name}
										className="w-full h-full object-contain p-2"
									/>
								) : (
									<span className="text-xs text-muted-foreground text-center px-2">
										No image
									</span>
								)}
							</div>
							<div
								className="flex-1"
								style={{ color: 'var(--muted-foreground)' }}>
								<h2 className="text-lg font-semibold">{item.products.name}</h2>
								<p
									className="text-foreground"
									style={{ color: 'var(--card-foreground)' }}>
									${Number(item.products.price).toFixed(2)}
								</p>
								<p
									className="text-sm"
									style={{ color: 'var(--card-foreground)' }}>
									Total: $
									{(item.cart.quantity * Number(item.products.price)).toFixed(
										2,
									)}
								</p>
							</div>
						</div>

						<div className="flex items-center gap-2 sm:gap-4 mt-4 sm:mt-0">
							<Button
								variant="outline"
								size="icon"
								className="h-8 w-8"
								onClick={async () => {
									const { data, error } = await actions.cart.updateCartItem({
										productId: item.products.id.toString(),
										decrement: true,
									});

									if (!error) {
										setCart(data.cart);
									}
								}}>
								<Minus className="h-4 w-4" />
							</Button>
							<span
								className="w-8 text-center"
								style={{ color: 'var(--card-foreground)' }}>
								{item.cart.quantity}
							</span>
							<Button
								variant="outline"
								size="icon"
								className="h-8 w-8"
								onClick={async () => {
									const { data, error } = await actions.cart.updateCartItem({
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
								className="h-8 w-8 ml-auto sm:ml-0 text-destructive"
								onClick={async () => {
									const { data, error } = await actions.cart.deleteCartItem({
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
				);
			})}

			{Object.values($cart).length > 0 && (
				<div className="w-full">
					<div className="flex justify-between mb-4">
						<span style={{ color: 'var(--foreground)' }}>Subtotal</span>
						<span
							className="font-medium"
							style={{ color: 'var(--foreground)' }}>
							${calculateTotal()}
						</span>
					</div>
					<Button
						className="w-full"
						onClick={async () => {
							const { data, error } = await actions.cart.checkout();
							if (!error && data && data.url) {
								window.location.href = data.url;
							} else {
								console.error('Error checking out:', error);
							}
						}}>
						<div className="flex items-center gap-2">
							<ShoppingBag /> Proceed to Checkout
						</div>
					</Button>
				</div>
			)}
		</>
	);
}

export default FullPageCart;
