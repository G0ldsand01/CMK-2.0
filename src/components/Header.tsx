import {
	ShoppingCart,
	Box,
	Cpu,
	Printer,
	Wifi,
	ArrowRight,
} from 'lucide-react';
import * as React from 'react';
import {
	NavigationMenu,
	NavigationMenuContent,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuList,
	NavigationMenuTrigger,
	navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import { cn } from '@/lib/utils';

const otherItems = [
	{
		title: 'All Products',
		href: '/products/',
		description: 'All CMK product collections available for purchase.',
		icon: ShoppingCart,
	},
	{
		title: 'Models',
		href: '/models',
		description: 'Purchase or download STL files to print yourself.',
		icon: Box,
	},
	{
		title: 'DIY Tech',
		href: '/tech',
		description: 'Electronics & custom CMK devices.',
		icon: Cpu,
	},
	{
		title: 'Custom 3D Printing',
		href: '/3dprint',
		description: 'High-quality 3D printing services on demand.',
		icon: Printer,
	},
];

export function HeaderMenu() {
	const currentPath =
		typeof window !== 'undefined' ? window.location.pathname : '';

	const isActive = (path: string) =>
		currentPath.startsWith(path) ? 'text-primary font-semibold' : '';

	return (
		<NavigationMenu>
			<NavigationMenuList>
				<MenuLink href="/" label="Home" />
				<ProductsDropdown />
				<MenuLink href="/about" label="About" />
				<MenuLink href="/contact" label="Contact" />
			</NavigationMenuList>
		</NavigationMenu>
	);
}

function MenuLink({ href, label }: { href: string; label: string }) {
	return (
		<NavigationMenuLink asChild>
			<a
				href={href}
				className={cn(
					navigationMenuTriggerStyle(),
					'px-4 py-2 transition-colors bg-translucent',
					'hover:bg-primary/20 hover:text-foreground',
				)}
			>
				{label}
			</a>
		</NavigationMenuLink>
	);
}

function ProductsDropdown() {
	return (
		<NavigationMenuItem>
			<NavigationMenuTrigger
				className={cn(
					navigationMenuTriggerStyle(),
					'px-4 py-2 transition-colors bg-translucent',
					'hover:bg-primary/20 hover:text-foreground',
					'data-[state=open]:bg-primary/25 data-[state=open]:text-foreground',
				)}
			>
				Products
			</NavigationMenuTrigger>

			<NavigationMenuContent
				className="min-w-[520px] translate-x-[-50%] left-1/2 relative
        bg-background/90 backdrop-blur-xl border border-border/50 rounded-xl shadow-xl
        py-4 px-3 animate-in fade-in slide-in-from-top-2 duration-200"
			>
				<ul className="flex flex-col divide-y divide-border/30">
					{otherItems.map((item) => (
						<ListItem key={item.title} {...item} />
					))}
				</ul>
			</NavigationMenuContent>
		</NavigationMenuItem>
	);
}

interface ListItemProps {
	title: string;
	icon: React.ElementType;
	description: string;
	href: string;
}

const ListItem = React.forwardRef<HTMLAnchorElement, ListItemProps>(
	({ title, icon: Icon, description, href, ...props }, ref) => (
		<li>
			<NavigationMenuLink asChild>
				<a
					href={href}
					ref={ref}
					className={cn(
						'group flex flex-row items-center gap-4 p-4 rounded-md transition-all cursor-pointer',
						'hover:bg-primary/10 hover:text-primary hover:scale-[1.05]',
						'focus:bg-primary/10 focus:text-primary',
						'duration-200 ease-in-out transform',
					)}
					{...props}
				>
					{/* Icon */}
					<Icon className="h-5 w-5 text-primary group-hover:scale-110 group-hover:rotate-3 transition-transform duration-150" />
					{/* Title + Description */}
					<div className="flex-1">
						<p className="text-sm font-semibold">{title}</p>
						<p className="text-xs opacity-70 leading-snug">{description}</p>
					</div>

					{/* Arrow micro animation on hover */}
					<ArrowRight
						className="h-4 w-4 opacity-0 group-hover:opacity-100 
          group-hover:translate-x-1 transition-all duration-150"
					/>
				</a>
			</NavigationMenuLink>
		</li>
	),
);

ListItem.displayName = 'ListItem';
