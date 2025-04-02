import * as React from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarRail,
  SidebarTrigger,
  SidebarInset,
  SidebarProvider,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { UsersIcon, HomeIcon, ShoppingCartIcon, Database,  Package, Tag, List, Star, UserRoundCog } from 'lucide-react';
import { UserMenu } from '@/components/UserMenu';
import { ModeToggle } from './ModeToggle';

const data = {
  navMain: [
    {
      title: 'Dashboard',
      url: '',
      items: [
        {
          title: 'Home',
          url: '/dashboard',
          icon: HomeIcon,
        },
      ],
    },
    {
      title: 'Users',
      url: '#',
      items: [
        {
          title: 'Manage Users',
          url: '#',
          icon: UsersIcon,
        },
        {
          title: 'Manage Roles',
          url: '#',
          icon: Database,
        },
      ],
    },
    {
      title: 'Products',
      url: '#',
      items: [
        {
          title: 'Manage Products',
          url: '#',
          icon: ShoppingCartIcon,
        },
        {
          title: 'Manage Categories',
          url: '#',
          icon: List,
        },
        {
          title: 'Manage Orders',
          url: '#',
          icon: Package,
        },
        {
          title: 'Manage Coupons',
          url: '#',
          icon: Tag,
        },
        {
          title: 'Manage Reviews',
          url: '#',
          icon: Star,
        },
        {
          title: 'Manage Settings',
          url: '#',
          icon: UserRoundCog,
        },
      ],
    },
  ],
  navUserSettings: [
    {
      title: 'Profile',
      url: '#',
    },
    {
      title: 'Settings',
      url: '#',
    },
    {
      title: 'Notifications',
      url: '#',
    },
    {
      title: 'Logout',
      url: '#',
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
      <SidebarHeader>
        <div className="text-2xl font-bold text-center">CMK</div>
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
                      <a href={item.url}>
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
        <UserMenu userData={userData} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

export function AdminSidebar({
  children,
  userData,
}: React.PropsWithChildren<{ userData: userData }>) {
  return (
    <SidebarProvider>
      <AppSidebar userData={userData} />
      <SidebarInset>
        <div className="pt-1 px-2 flex justify-between items-center">
          <SidebarTrigger />
          <ModeToggle />
        </div>
        <SidebarContent className="px-2">{children}</SidebarContent>
      </SidebarInset>
    </SidebarProvider>
  );
}
