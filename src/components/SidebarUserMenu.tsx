import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from '@/components/ui/sidebar';
import {
	Heart,
	LogOutIcon,
	MoreVerticalIcon,
	Package,
	UserCircleIcon,
} from 'lucide-react';
import type { userData } from './AdminSidebar';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

export function SidebarUserMenu({ userData }: { userData: userData }) {
	const { isMobile } = useSidebar();
	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<SidebarMenuButton
							size="lg"
							className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
						>
							<Avatar className="h-8 w-8 rounded-lg">
								<AvatarImage src={userData.image} alt={userData.name} />
								<AvatarFallback className="rounded-lg">
									{userData.name.charAt(0)}
								</AvatarFallback>
							</Avatar>
							<div className="grid flex-1 text-left text-sm leading-tight">
								<span className="truncate font-medium">{userData.name}</span>
								<span className="truncate text-xs text-muted-foreground">
									{userData.email}
								</span>
							</div>
							<MoreVerticalIcon className="ml-auto size-4" />
						</SidebarMenuButton>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
						side={isMobile ? 'bottom' : 'right'}
						align="end"
						sideOffset={4}
					>
						<DropdownMenuLabel className="p-0 font-normal">
							<div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
								<Avatar className="h-8 w-8 rounded-lg">
									<AvatarImage src={userData.image} alt={userData.name} />
									<AvatarFallback className="rounded-lg">
										{userData.name.charAt(0)}
									</AvatarFallback>
								</Avatar>
								<div className="grid flex-1 text-left text-sm leading-tight">
									<span className="truncate font-medium">{userData.name}</span>
									<span className="truncate text-xs text-muted-foreground">
										{userData.email}
									</span>
								</div>
							</div>
						</DropdownMenuLabel>
						<DropdownMenuSeparator />
						<DropdownMenuGroup>
							<a href="/dashboard">
								<DropdownMenuItem>
									<UserCircleIcon />
									Account
								</DropdownMenuItem>
							</a>
							<a href="/dashboard/orders">
								<DropdownMenuItem>
									<Package />
									Orders
								</DropdownMenuItem>
							</a>
							<a href="/dashboard/wishlist">
								<DropdownMenuItem>
									<Heart />
									Whishlist
								</DropdownMenuItem>
							</a>
						</DropdownMenuGroup>
						<DropdownMenuSeparator />
						<a href="/logout">
							<DropdownMenuItem>
								<LogOutIcon />
								Log out
							</DropdownMenuItem>
						</a>
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
	);
}
