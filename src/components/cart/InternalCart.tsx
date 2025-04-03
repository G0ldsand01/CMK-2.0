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
import { Separator } from '../ui/separator';
import { setCart } from '@/lib/cart';
import { cartAtom } from '@/store';
import { useStore } from '@nanostores/react';
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

  return (
    <Sheet
      onOpenChange={(open) => {
        if (open) {
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
        style={{
          zIndex: 1000,
        }}
      >
        <SheetHeader>
          <SheetTitle>Your cart</SheetTitle>
          <SheetDescription>
            {Object.values($cart).length} items in your cart
            <div className="flex flex-col gap-2">
              {Object.values($cart).map((item) => (
                <div key={item.products.id} className="flex flex-row gap-2">
                  <h3 className="text-lg font-bold">{item.products.name}</h3>
                  <p className="text-sm text-gray-500">{item.products.price}</p>
                  <p className="text-sm text-gray-500">{item.cart.quantity}</p>
                  <Separator />
                </div>
              ))}
            </div>
          </SheetDescription>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  );
}
