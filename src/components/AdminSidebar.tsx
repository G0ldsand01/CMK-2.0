// src/components/AdminSidebar.tsx
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
} from '@/components/ui/sidebar';
import { LayoutDashboardIcon, ListIcon, BarChartIcon, FolderIcon, UsersIcon, SettingsIcon, BellIcon, HomeIcon } from 'lucide-react';
import { UserMenu } from '@/components/UserMenu'; // Ensure the path is correct

const data = {
  versions: ['1.0.1', '1.1.0-alpha', '2.0.0-beta1'],
  navMain: [
    {
      title: 'Dashboard',
      url: '#',
      icon: LayoutDashboardIcon,
    },
    {
      title: 'Lifecycle',
      url: '#',
      icon: ListIcon,
    },
    {
      title: 'Analytics',
      url: '#',
      icon: BarChartIcon,
    },
    {
      title: 'Projects',
      url: '#',
      icon: FolderIcon,
    },
    {
      title: 'Team',
      url: '#',
      icon: UsersIcon,
    },
    {
      title: 'Settings',
      url: '#',
      icon: SettingsIcon,
    },
    {
      title: 'Notifications',
      url: '#',
      icon: BellIcon,
    },
    { 
      title: 'Back to Home',
      url: '/',
      icon: HomeIcon,
    },
  ],
};

function AppSidebar({ user }: { user: { name: string }}) {
  return (
    <Sidebar>
      <SidebarHeader>
        <UserMenu user={user}  />
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {data.navMain.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <a href={item.url} className="flex items-center gap-2">
                  <item.icon size={18} />
                  {item.title}
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}

export function AdminSidebar({ user, children }: React.PropsWithChildren<{ user: { name: string } }>) {
  return (
    <SidebarProvider>
      <AppSidebar user={user} />
      <SidebarInset>
        <SidebarTrigger />
        <SidebarContent>{children}</SidebarContent>
      </SidebarInset>
    </SidebarProvider>
  );
}
