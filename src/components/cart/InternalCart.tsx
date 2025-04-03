import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '../ui/sheet';

export default function InternalCart({
  children,
  cart,
  classes,
}: React.PropsWithChildren<{
  cart: {
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
}>) {
  return (
    <Sheet>
      <SheetTrigger>
        <button className={cn(classes)}>{children}</button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Your cart</SheetTitle>
          <SheetDescription>
            {cart.length} items in your cart
            <div className="flex flex-col gap-2">
              {cart.map((item) => (
                <div>
                  <h3>{item.products.name}</h3>
                  <p>{item.products.price}</p>
                  <p>{item.cart.quantity}</p>
                </div>
              ))}
            </div>
          </SheetDescription>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  );
}
