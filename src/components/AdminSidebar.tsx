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
} from '@/components/ui/sidebar';
import {
	CircuitBoard,
	Database,
	HomeIcon,
	LayoutDashboard,
	List,
	Package,
	ShoppingCartIcon,
	Star,
	Tag,
	UserRoundCog,
	UsersIcon,
} from 'lucide-react';
import type * as React from 'react';
import { ModeToggle } from './ModeToggle';
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbSeparator,
} from './ui/breadcrumb';

const data = {
	navMain: [
		{
			title: 'Dashboard',
			items: [
				{
					title: 'Home',
					url: '/',
					icon: HomeIcon,
				},
				{
					title: 'Dashboard',
					url: '/admin',
					icon: LayoutDashboard,
				},
			],
		},
		{
			title: 'Users',
			items: [
				{
					title: 'Manage Users',
					url: '/admin/users',
					icon: UsersIcon,
				},
				{
					title: 'Manage Roles',
					url: '/admin/roles',
					icon: Database,
				},
			],
		},
		{
			title: 'Products',
			items: [
				{
					title: 'Manage Products',
					url: '/admin/products',
					icon: ShoppingCartIcon,
				},
				{
					title: 'Manage Categories',
					url: '/admin/categories',
					icon: List,
				},
				{
					title: 'Manage Orders',
					url: '/admin/orders',
					icon: Package,
				},
				{
					title: 'Manage Coupons',
					url: '/admin/coupons',
					icon: Tag,
				},
				{
					title: 'Manage Reviews',
					url: '/admin/reviews',
					icon: Star,
				},
			],
		},
		{
			title: 'Miscellaneous',
			items: [
				{
					title: 'Manage Settings',
					url: '/settings',
					icon: UserRoundCog,
				},
			],
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

export function AppSidebar({
	userData,
	...props
}: React.ComponentProps<typeof Sidebar> & { userData: userData }) {
	return (
		<Sidebar {...props}>
			<SidebarHeader className="flex items-center justify-center">
				<div className="flex items-center">
					<a
						href="/"
						aria-label="Home"
						title="Home"
						className="flex items-center"
					>
						<CircuitBoard size={24} className="mr-2 m-0.5" />
						<div className="text-2xl font-bold">CMK</div>
					</a>
				</div>
			</SidebarHeader>
			<SidebarContent>
				{data.navMain.map((item) => (
					<SidebarGroup key={item.title}>
						<SidebarGroupLabel>{item.title}</SidebarGroupLabel>
						<SidebarGroupContent>
							<SidebarMenu>
								{item.items.map((item) => (
									<SidebarMenuItem key={item.title}>
										<SidebarMenuButton asChild>
											<a href={`/dashboard${item.url}`}>
												<item.icon size={16} />
												{item.title}
											</a>
										</SidebarMenuButton>
									</SidebarMenuItem>
								))}
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>
				))}
			</SidebarContent>
			<SidebarFooter>
				<SidebarUserMenu userData={userData} />
			</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	);
}

export function AdminSidebar({
	children,
	userData,
	breadcrumb,
}: React.PropsWithChildren<{
	userData: userData;
	breadcrumb: Record<string, string>;
}>) {
	return (
		<SidebarProvider>
			<AppSidebar userData={userData} />
			<SidebarInset>
				<div className="pt-1 px-2 flex justify-between items-center">
					<SidebarTrigger />
					<Breadcrumb>
						<BreadcrumbList>
							<BreadcrumbItem>
								<BreadcrumbLink href="/dashboard/admin">
									Admin Dashboard
								</BreadcrumbLink>
							</BreadcrumbItem>
							<BreadcrumbSeparator />
							{Object.keys(breadcrumb).map((value) => (
								<BreadcrumbItem key={value}>
									<BreadcrumbLink href={`/dashboard/admin${value}`}>
										{breadcrumb[value]}
									</BreadcrumbLink>
								</BreadcrumbItem>
							))}
						</BreadcrumbList>
					</Breadcrumb>
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
