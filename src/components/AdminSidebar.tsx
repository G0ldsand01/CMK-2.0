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
  useSidebar,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from '@/components/ui/sidebar';
import {
  LayoutDashboardIcon,
  ListIcon,
  BarChartIcon,
  FolderIcon,
  UsersIcon,
  SettingsIcon,
  BellIcon,
  HomeIcon,
} from 'lucide-react';
import { UserMenu } from '@/components/UserMenu'; // Ensure the path is correct
import type User from '@/lib/models/user';

const data = {
  versions: ['1.0.1', '1.1.0-alpha', '2.0.0-beta1'],
  navMain: [
    {
      title: 'Dashboard',
      url: '#',
      items: [
        {
          title: 'Home',
          url: '#',
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
        },
        {
          title: 'Manage Roles',
          url: '#',
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
        },
        {
          title: 'Manage Categories',
          url: '#',
        },
        {
          title: 'Manage Orders',
          url: '#',
        },
        {
          title: 'Manage Coupons',
          url: '#',
        },
        {
          title: 'Manage Reviews',
          url: '#',
        },
        {
          title: 'Manage Settings',
          url: '#',
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
      <SidebarHeader>
        <UserMenu userData={userData} />
      </SidebarHeader>
      <SidebarContent>
        {data.navMain.map((item) => (
          <SidebarGroup key={item.title}>
            <SidebarGroupLabel>{item.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {item.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={true}>
                      <a href={item.url}>{item.title}</a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
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
        <SidebarTrigger />
        <SidebarContent>{children}</SidebarContent>
      </SidebarInset>
    </SidebarProvider>
  );
}
