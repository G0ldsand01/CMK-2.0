import { useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { setCart } from '@/lib/cart'; // Ensure both are correctly imported from the store
import { actions } from 'astro:actions';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { cartAtom } from '@/store';
import { Button } from '../ui/button';
export default function CartPage({ newCart }: { newCart: any[] }) {
	const cart = useStore(cartAtom);
	useEffect(() => {
		setCart(newCart);
	}, [newCart]);

	const calculateTotal = () =>
		Object.values(cart)
			.reduce(
				(total, item) =>
					total + parseFloat(item.products.price) * item.cart.quantity,
				0
			)
			.toFixed(2);

	if (Object.values(cart).length === 0) {
		return (
			<div className="text-center py-16 text-gray-500">
				<p>Your cart is empty.</p>
				<Button variant="outline" className="mt-4" asChild>
					<a href="/products">Continue Shopping</a>
				</Button>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			{Object.values(cart).map((item) => (
				<div
					key={item.products.id}
					className="flex items-start gap-4 bg-card p-4 rounded-lg shadow"
				>
					<img
						src={`/api/image/${item.products.image}.png`}
						alt={item.products.name}
						className="w-20 h-20 object-cover rounded-md"
					/>
					<div className="flex-1">
						<h2 className="font-semibold">{item.products.name}</h2>
						<p className="text-sm text-gray-500">${item.products.price}</p>
						<div className="flex items-center gap-2 mt-2">
							<Button
								variant="outline"
								size="icon"
								onClick={async () => {
									const { data, error } =
										await actions.cart.updateCartItem({
											productId: item.products.id.toString(),
											decrement: true,
										});
									if (!error) setCart(data.cart);
								}}
							>
								<Minus className="w-4 h-4" />
							</Button>
							<span className="w-6 text-center">{item.cart.quantity}</span>
							<Button
								variant="outline"
								size="icon"
								onClick={async () => {
									const { data, error } =
										await actions.cart.updateCartItem({
											productId: item.products.id.toString(),
											increment: true,
										});
									if (!error) setCart(data.cart);
								}}
							>
								<Plus className="w-4 h-4" />
							</Button>
							<Button
								variant="ghost"
								size="icon"
								className="ml-auto text-destructive"
								onClick={async () => {
									const { data, error } =
										await actions.cart.deleteCartItem({
											productId: item.products.id.toString(),
										});
									if (!error) setCart(data.cart);
								}}
							>
								<Trash2 className="w-4 h-4" />
							</Button>
						</div>
					</div>
				</div>
			))}

			<div className="flex justify-between items-center pt-4 border-t">
				<span className="text-gray-500">Subtotal</span>
				<span className="font-semibold">${calculateTotal()}</span>
			</div>
			<Button className="w-full">Proceed to Checkout</Button>
		</div>
	);
}
