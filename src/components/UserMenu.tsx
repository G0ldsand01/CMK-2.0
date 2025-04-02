import * as React from 'react';
import { Check, ChevronsUpDown, GalleryVerticalEnd, Link } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import type { userData } from './AdminSidebar';

export function UserMenu({ userData }: { userData: userData }) {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <img
                  src={userData.image}
                  alt={userData.name}
                  width={32}
                  height={32}
                  className="rounded-lg"
                />
              </div>
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="font-semibold">{userData.name}</span>
                <span className="">{userData.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width]"
            align="start"
          >
            {/* {versions.map((version) => (
              <DropdownMenuItem
                key={version}
                onSelect={() => setSelectedVersion(version)}
              >
                v{version}{' '}
                {version === selectedVersion && <Check className="ml-auto" />}
              </DropdownMenuItem>
            ))} */}
            <DropdownMenuItem>
              <a href="/dashboard">Dashboard</a>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <a href="/dashboard">Dashboard</a>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
