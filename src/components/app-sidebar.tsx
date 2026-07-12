import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Truck, Users, Route as RouteIcon, Wrench, Fuel,
  BarChart3, Shield, LogOut, Activity,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";

const nav = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Vehicles", url: "/vehicles", icon: Truck },
  { title: "Drivers", url: "/drivers", icon: Users },
  { title: "Trips", url: "/trips", icon: RouteIcon },
  { title: "Maintenance", url: "/maintenance", icon: Wrench },
  { title: "Fuel & Expenses", url: "/fuel", icon: Fuel },
  { title: "Reports", url: "/reports", icon: BarChart3 },
  { title: "Activity", url: "/activity", icon: Activity },
  { title: "Users & RBAC", url: "/users", icon: Shield, admin: true },
];

export function AppSidebar() {
  const path = useRouterState({ select: (r) => r.location.pathname });
  const { currentUser, logout } = useStore();
  const isAdmin = currentUser?.role === "Admin";

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold">T</div>
          <div className="group-data-[collapsible=icon]:hidden">
            <div className="text-sm font-semibold leading-none">TransitOps</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">Fleet Operations</div>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Operations</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {nav.filter((i) => !i.admin || isAdmin).map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={path === item.url}>
                    <Link to={item.url} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="px-2 pb-2 group-data-[collapsible=icon]:hidden">
          <div className="text-xs font-medium truncate">{currentUser?.name}</div>
          <div className="text-[10px] text-muted-foreground truncate">{currentUser?.role}</div>
        </div>
        <Button variant="ghost" size="sm" className="justify-start" onClick={logout}>
          <LogOut className="h-4 w-4 mr-2" /> <span className="group-data-[collapsible=icon]:hidden">Sign out</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
