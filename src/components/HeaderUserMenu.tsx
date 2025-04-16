import {
  LogOutIcon,
  MoreVerticalIcon,
  Settings,
  ShoppingCart,
  UserCircleIcon,
} from 'lucide-react';
import type { userData } from './AdminSidebar';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

export function HeaderUserMenu({ userData }: { userData: userData }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="lg"
          className="flex items-center gap-2 px-2 data-[state=open]:bg-accent data-[state=open]:text-accent-foreground"
        >
          <Avatar className="h-8 w-8 rounded-lg">
            <AvatarImage src={userData.image} alt={userData.name} />
            <AvatarFallback className="rounded-lg">
              {userData.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium">{userData.name}</span>
          </div>
          <MoreVerticalIcon className="ml-auto size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
        style={{ zIndex: 999 }}
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
              Dashboard
            </DropdownMenuItem>
          </a>
          <a href="/cart">
            <DropdownMenuItem>
              <ShoppingCart />
              My Cart
            </DropdownMenuItem>
          </a>
          <a href="/dashboard/settings">
            <DropdownMenuItem>
              <Settings />
              User Settings
            </DropdownMenuItem>
          </a>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {userData.role === 'admin' && (
          <a href="/dashboard/admin">
            <DropdownMenuItem>
              <UserCircleIcon />
              Admin Panel
            </DropdownMenuItem>
          </a>
        )}
        <DropdownMenuSeparator />
        <a href="/logout">
          <DropdownMenuItem>
            <LogOutIcon />
            Log out
          </DropdownMenuItem>
        </a>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
