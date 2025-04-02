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
  MenuIcon,
} from 'lucide-react';
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
      title: 'Orders',
      url: '#',
      icon: ListIcon,
    },
    {
      title: 'Projects',
      url: '#',
      icon: FolderIcon,
    },
  ],
  navTeams: [
    {
      title: 'Team',
      url: '#',
      icon: UsersIcon,
    },
    {
      title: 'Projects',
      url: '#',
      icon: FolderIcon,
    },
  ],
  navSettings: [
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
      title: 'Back to User Dashboard',
      url: '/dashboard',
      icon: LayoutDashboardIcon,
    },
    {
      title: 'Back to Home',
      url: '/',
      icon: HomeIcon,
    },
  ],
};

function AppSidebar({ user }: { user: { name: string }}) {
  const { collapsed, toggle } = useSidebar();
  
  return (
    <Sidebar>
      <SidebarHeader>
        <button onClick={toggle} className="p-2 focus:outline-none">
          <MenuIcon size={24} />
        </button>
        <a href="/" className="flex items-center gap-2 p-4">
          <img src="{logo}" alt="Logo" width={32} height={32} />
          <span className="font-bold text-lg">CMK</span>
        </a>
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
        <SidebarMenu>
          <SidebarMenuItem key="teams" className="text-muted-foreground">
            Teams
          </SidebarMenuItem>
          {data.navTeams.map((item) => (
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
      <SidebarMenu>
        <SidebarMenuItem key="settings" className="text-muted-foreground">
          Settings
        </SidebarMenuItem>
        {data.navSettings.map((item) => (
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
      <UserMenu user={user} />
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
