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
import { Package } from 'lucide-react';
import * as React from 'react';

const featuredItem = {
	title: 'Products',
	href: '/products/',
	description: 'A collection of products that are available for purchase.',
	image: Package,
};

const otherItems = [
	{
		title: 'Models',
		href: '/models',
		description:
			'A collection of models that are available for Purchase / Print.',
		image: Package,
	},
	{
		title: 'Tech',
		href: '/tech',
		description:
			'A collection of electronic devices that are available for purchase.',
		image: Package,
	},
	{
		title: '3D Printing',
		href: '/3dprint',
		description:
			'A collection of 3D printing services that are available for purchase.',
		image: Package,
	},
	{
		title: 'IOT',
		href: '/iot',
		description: 'A collection of IOT devices that are available for purchase.',
		image: Package,
	},
];

export function HeaderMenu() {
	return (
		<NavigationMenu>
			<NavigationMenuList>
				<NavigationMenuLink asChild>
					<a
						href="/"
						data-astro-prefetch
						className={navigationMenuTriggerStyle()}
					>
						Home
					</a>
				</NavigationMenuLink>
				<NavigationMenuItem>
					<NavigationMenuTrigger className={navigationMenuTriggerStyle()}>
						Products
					</NavigationMenuTrigger>
					<NavigationMenuContent className="w-[300px] md:w-[400px] lg:w-[500px]">
						<ul className="grid gap-3 p-4 lg:grid-cols-[1fr_1.5fr]">
							{/* Featured card */}
							<li className="row-span-4">
								<a
									className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none hover:shadow-md"
									href={featuredItem.href}
								>
									{React.createElement(featuredItem.image, {
										className: 'h-6 w-6 text-foreground mb-4',
									})}
									<div className="mb-2 mt-4 text-lg font-medium">
										{featuredItem.title}
									</div>
									<p className="text-sm leading-tight text-muted-foreground">
										{featuredItem.description}
									</p>
								</a>
							</li>

							{/* Other links */}
							{otherItems.map((item) => (
								<ListItem key={item.title} title={item.title} href={item.href}>
									{item.description}
								</ListItem>
							))}
						</ul>
					</NavigationMenuContent>
				</NavigationMenuItem>
				<NavigationMenuLink asChild>
					<a
						href="/about"
						data-astro-prefetch
						className={navigationMenuTriggerStyle()}
					>
						About
					</a>
				</NavigationMenuLink>
				<NavigationMenuLink asChild>
					<a
						href="/contact"
						data-astro-prefetch
						className={navigationMenuTriggerStyle()}
					>
						Contact
					</a>
				</NavigationMenuLink>
			</NavigationMenuList>
		</NavigationMenu>
	);
}

interface ListItemProps extends React.ComponentPropsWithoutRef<'a'> {
	title: string;
	img?: React.ElementType;
}

const ListItem = React.forwardRef<React.ElementRef<'a'>, ListItemProps>(
	({ className, title, children, ...props }, ref) => {
		return (
			<li>
				<NavigationMenuLink asChild>
					<a
						ref={ref}
						className={cn(
							'block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
							className,
						)}
						{...props}
					>
						<div className="text-sm font-medium leading-none">{title}</div>
						<p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
							{children}
						</p>
					</a>
				</NavigationMenuLink>
			</li>
		);
	},
);
ListItem.displayName = 'ListItem';
