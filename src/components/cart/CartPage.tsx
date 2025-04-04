import { actions } from 'astro:actions';
import { useStore } from '@nanostores/react';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { type CartItem, setCart } from '@/lib/cart';
import { cartAtom } from '@/store';
import { Button } from '../ui/button';

export default function CartPage({ newCart }: { newCart: CartItem[] }) {
	const $cart = useStore(cartAtom);
	const [isInitialized, setIsInitialized] = useState(false);

	useEffect(() => {
		if (!isInitialized) {
			setCart(newCart);
			setIsInitialized(true);
		}
	}, [newCart, isInitialized]);

	const calculateTotal = () => {
		return Object.values($cart)
			.reduce(
				(total, item) =>
					total + Number.parseFloat(item.products.price) * item.cart.quantity,
				0,
			)
			.toFixed(2);
	};

	if (Object.values($cart).length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-16 text-gray-500">
				<p className="text-lg">Your cart is empty.</p>
				<Button variant="outline" className="mt-4" asChild>
					<a href="/products">Continue Shopping</a>
				</Button>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="text-sm text-gray-500">
				{Object.values($cart).length} items in your cart
			</div>
			<div className="flex flex-col gap-4">
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
							<p className="text-sm text-gray-500">${item.products.price}</p>
							<div className="flex items-center gap-2 mt-2">
								<Button
									variant="outline"
									size="icon"
									className="h-8 w-8"
									onClick={async () => {
										const { data, error } = await actions.cart.updateCartItem({
											productId: item.products.id.toString(),
											decrement: true,
										});
										if (!error) setCart(data.cart);
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
										if (!error) setCart(data.cart);
									}}
								>
									<Plus className="h-4 w-4" />
								</Button>
								<Button
									variant="ghost"
									size="icon"
									className="h-8 w-8 ml-auto text-destructive"
									onClick={async () => {
										const { data, error } = await actions.cart.deleteCartItem({
											productId: item.products.id.toString(),
										});
										if (!error) setCart(data.cart);
									}}
								>
									<Trash2 className="h-4 w-4" />
								</Button>
							</div>
						</div>
					</div>
				))}
			</div>

			<div className="mt-6 pt-4 border-t">
				<div className="flex justify-between mb-4">
					<span className="text-gray-500">Subtotal</span>
					<span className="font-medium">${calculateTotal()}</span>
				</div>
				<Button className="w-full">Proceed to Checkout</Button>
			</div>
		</div>
	);
}
