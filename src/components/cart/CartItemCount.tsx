import { useStore } from '@nanostores/react';
import { cartAtom } from '@/store';

function CartItemCount() {
	const cart = useStore(cartAtom);
	const itemCount = Object.keys(cart).length;

    if (itemCount === 0) {
        return null;
    }

	return (
		<span
			id="cart-count"
			className="bg-muted text-foreground text-xs w-5 h-5 flex items-center justify-center rounded-full ml-2"
		>
			{itemCount}
		</span>
	);
}

export default CartItemCount;
