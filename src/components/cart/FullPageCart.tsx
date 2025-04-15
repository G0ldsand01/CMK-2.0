import { actions } from 'astro:actions';
import { type CartItem, setCart } from '@/lib/cart';
import { cartAtom } from '@/store';
import { useStore } from '@nanostores/react';
import { ShoppingBag, Trash2 } from 'lucide-react';
import { Plus } from 'lucide-react';
import { Minus } from 'lucide-react';
import { useState } from 'react';
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
			{Object.values($cart).map((item) => (
				<div
					key={item.products.id}
					className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 bg-[var(--muted)] p-4 rounded-lg shadow-sm my-4"
				>
					<div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full">
						<img
							src={`/api/image/${item.products.image}.png`}
							alt={item.products.name}
							className="w-20 h-20 rounded-md overflow-hidden bg-gray-100"
						/>
						<div className="flex-1">
							<h2 className="text-lg font-semibold">{item.products.name}</h2>
							<p className="text-foreground">
								${Number(item.products.price).toFixed(2)}
							</p>
							<p className="text-sm text-foreground">
								Total: $
								{(item.cart.quantity * Number(item.products.price)).toFixed(2)}
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
							}}
						>
							<Minus className="h-4 w-4" />
						</Button>
						<span className="w-8 text-center">{item.cart.quantity}</span>
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
							}}
						>
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
							}}
						>
							<Trash2 className="h-4 w-4" />
						</Button>
					</div>
				</div>
			))}

			{Object.values($cart).length > 0 && (
				<div className="w-full">
					<div className="flex justify-between mb-4">
						<span className="text-gray-500">Subtotal</span>
						<span className="font-medium">${calculateTotal()}</span>
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
						}}
					>
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
