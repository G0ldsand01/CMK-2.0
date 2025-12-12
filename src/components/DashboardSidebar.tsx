import {
	Bell,
	CircuitBoard,
	Heart,
	HelpCircle,
	HomeIcon,
	Package,
	Settings,
	ShoppingBag,
	ShoppingCartIcon,
	Sparkles,
	Store,
	User,
	UserCog,
} from 'lucide-react';
import * as React from 'react';
import { SidebarUserMenu } from '@/components/SidebarUserMenu';
import { Separator } from '@/components/ui/separator';
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarInset,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarProvider,
	SidebarRail,
	SidebarTrigger,
	useSidebar,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { ModeToggle } from './ModeToggle';
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from './ui/breadcrumb';

const data = {
	navMain: [
		{
			title: 'Main',
			items: [
				{
					title: 'Dashboard',
					url: '/dashboard',
					icon: HomeIcon,
				},
				{
					title: 'Shop',
					url: '/products',
					icon: Store,
				},
				{
					title: 'Cart',
					url: '/cart',
					icon: ShoppingBag,
				},
			],
		},
		{
			title: 'My Account',
			items: [
				{
					title: 'My Orders',
					url: '/dashboard/orders',
					icon: Package,
				},
				{
					title: 'Wishlist',
					url: '/dashboard/wishlist',
					icon: Heart,
				},
			],
		},
		{
			title: 'Preferences',
			items: [
				{
					title: 'Settings',
					url: '/dashboard/settings',
					icon: Settings,
				},
			],
		},
		{
			title: 'Support',
			items: [
				{
					title: 'Help Center',
					url: '/contact',
					icon: HelpCircle,
				},
			],
		},
	],
	navUserSettings: [
		{
			title: 'Profile',
			url: '/dashboard',
		},
		{
			title: 'Settings',
			url: '/dashboard/settings',
		},
		{
			title: 'Logout',
			url: '/logout',
		},
	],
};

export type userData = {
	id: string;
	name: string;
	email: string;
	image: string;
	role: string;
};

const getNavData = (role: string) => {
	const navData = [...data.navMain];

	if (role === 'admin') {
		navData.push({
			title: 'Administration',
			items: [
				{
					title: 'Admin Dashboard',
					url: '/dashboard/admin',
					icon: Sparkles,
				},
				{
					title: 'Manage Products',
					url: '/dashboard/admin/products',
					icon: Package,
				},
				{
					title: 'Manage Orders',
					url: '/dashboard/admin/orders',
					icon: ShoppingCartIcon,
				},
				{
					title: 'Manage Users',
					url: '/dashboard/admin/users',
					icon: UserCog,
				},
			],
		});
	}

	return navData;
};

export function AppSidebar({
	userData,
	...props
}: React.ComponentProps<typeof Sidebar> & { userData: userData }) {
	const navData = getNavData(userData?.role);
	const [currentPath, setCurrentPath] = React.useState('');
	const [isMounted, setIsMounted] = React.useState(false);

	// Get sidebar state - must call hook unconditionally
	const { state } = useSidebar();
	const isCollapsed = state === 'collapsed';

	// Prevent hydration mismatch by only rendering text after mount
	React.useEffect(() => {
		setIsMounted(true);
	}, []);

	React.useEffect(() => {
		// Set initial path
		setCurrentPath(window.location.pathname);

		// Listen for navigation changes (for SPA-like behavior)
		const handleLocationChange = () => {
			setCurrentPath(window.location.pathname);
		};

		// Listen for popstate (back/forward navigation)
		window.addEventListener('popstate', handleLocationChange);

		// For Astro apps, we need to check on every render/focus
		// This handles cases where navigation happens via full page reloads
		const handleFocus = () => {
			setCurrentPath(window.location.pathname);
		};

		window.addEventListener('focus', handleFocus);

		return () => {
			window.removeEventListener('popstate', handleLocationChange);
			window.removeEventListener('focus', handleFocus);
		};
	}, []);

	const isActive = (url: string) => {
		const href = url.startsWith('/') ? url : `/dashboard${url}`;
		if (href === '/dashboard') {
			return currentPath === '/dashboard' || currentPath === '/dashboard/';
		}
		return currentPath.startsWith(href);
	};

	return (
		<Sidebar
			{...props}
			className="bg-sidebar border-r border-sidebar-border overflow-hidden">
			<SidebarHeader
				className={cn(
					'border-b border-sidebar-border px-4 py-5',
					isCollapsed && 'px-2',
				)}>
				<a
					href="/"
					aria-label="Home"
					title="Home"
					className={cn(
						'flex items-center gap-3 transition-all hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring rounded-lg p-2 -ml-2 hover:bg-sidebar-accent/50 overflow-hidden',
						isCollapsed && 'justify-center ml-0',
					)}>
					<div className="relative shrink-0">
						<CircuitBoard size={32} className="text-sidebar-primary" />
						{!isCollapsed && (
							<div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-sidebar-primary rounded-full animate-pulse" />
						)}
					</div>
					{typeof window !== 'undefined' && isMounted && !isCollapsed && (
						<div className="flex flex-col min-w-0" suppressHydrationWarning>
							<span className="text-xl font-bold text-sidebar-foreground tracking-tight leading-none truncate">
								CMK
							</span>
							<span className="text-xs text-sidebar-foreground/60 font-medium truncate">
								Dashboard
							</span>
						</div>
					)}
				</a>
			</SidebarHeader>
			<SidebarContent className="px-2 py-4">
				{navData.map((group, groupIndex) => (
					<SidebarGroup
						key={group.title}
						className={cn(
							'mb-5 last:mb-0',
							groupIndex > 0 && 'pt-2 border-t border-sidebar-border/50',
						)}>
						<SidebarGroupLabel className="px-3 mb-3 text-[10px] font-bold text-sidebar-foreground/50 uppercase tracking-[0.15em]">
							{group.title}
						</SidebarGroupLabel>
						<SidebarGroupContent>
							<SidebarMenu className="space-y-0.5">
								{group.items.map((item) => {
									const Icon = item.icon;
									const href = item.url.startsWith('/')
										? item.url
										: `/dashboard${item.url}`;
									const active = isActive(item.url);

									return (
										<SidebarMenuItem key={item.title}>
											<SidebarMenuButton
												asChild
												isActive={active}
												className={cn(
													'group relative transition-all duration-200 h-9',
													active &&
														'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-sidebar-primary before:rounded-r-full',
													!active &&
														'hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground',
												)}>
												<a
													href={href}
													className="flex items-center gap-3 w-full">
													<Icon
														size={18}
														className={cn(
															'shrink-0 transition-all',
															active
																? 'text-sidebar-primary scale-110'
																: 'text-sidebar-foreground/70 group-hover:text-sidebar-foreground',
														)}
													/>
													<span
														className={cn(
															'font-medium text-sm',
															active && 'font-semibold',
														)}>
														{item.title}
													</span>
												</a>
											</SidebarMenuButton>
										</SidebarMenuItem>
									);
								})}
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>
				))}
			</SidebarContent>
			<SidebarFooter className="border-t border-sidebar-border px-2 py-3 bg-sidebar/50">
				<SidebarUserMenu userData={userData} />
			</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	);
}

export function DashboardSidebar({
	children,
	userData,
	breadcrumb,
}: React.PropsWithChildren<{
	userData: userData;
	breadcrumb: Record<string, string>;
}>) {
	const breadcrumbEntries = Object.entries(breadcrumb);

	return (
		<SidebarProvider>
			<AppSidebar userData={userData} />
			<SidebarInset>
				<div className="pt-1 px-2 flex justify-between items-center">
					<div className="flex items-center gap-2 flex-1 min-w-0">
						<SidebarTrigger />
						<Separator
							orientation="vertical"
							className="h-6! w-px mx-1 bg-border shrink-0"
						/>
						<Breadcrumb className="flex-1 min-w-0">
							<BreadcrumbList className="flex items-center gap-1.5 text-sm">
								<BreadcrumbItem>
									<BreadcrumbLink href="/dashboard" className="text-sm">
										Dashboard
									</BreadcrumbLink>
								</BreadcrumbItem>
								{breadcrumbEntries.length > 0 && (
									<>
										<BreadcrumbSeparator />
										{breadcrumbEntries.map(([key, label], index) => {
											const isLast = index === breadcrumbEntries.length - 1;
											const href = key.startsWith('/')
												? key
												: `/dashboard/${key.replace(/^\//, '')}`;

											return (
												<React.Fragment key={key}>
													<BreadcrumbItem>
														{isLast ? (
															<BreadcrumbPage className="text-sm">
																{label}
															</BreadcrumbPage>
														) : (
															<BreadcrumbLink href={href} className="text-sm">
																{label}
															</BreadcrumbLink>
														)}
													</BreadcrumbItem>
													{!isLast && <BreadcrumbSeparator />}
												</React.Fragment>
											);
										})}
									</>
								)}
							</BreadcrumbList>
						</Breadcrumb>
					</div>
					<ModeToggle />
				</div>
				<SidebarContent className="px-2 pt-2">
					<Separator className="mb-2" />
					{children}
				</SidebarContent>
			</SidebarInset>
		</SidebarProvider>
	);
}
