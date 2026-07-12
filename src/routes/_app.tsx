import { createFileRoute, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { NotificationsBell } from "@/components/notifications-bell";
import { useStore } from "@/lib/store";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

const titles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/vehicles": "Vehicle Registry",
  "/drivers": "Driver Management",
  "/trips": "Trip Management",
  "/maintenance": "Maintenance",
  "/fuel": "Fuel & Expenses",
  "/reports": "Reports & Analytics",
  "/users": "Users & RBAC",
  "/activity": "Activity Timeline",
};

function AppLayout() {
  const { currentUser } = useStore();
  const navigate = useNavigate();
  const path = useRouterState({ select: (r) => r.location.pathname });

  useEffect(() => {
    if (!currentUser) navigate({ to: "/login", replace: true });
  }, [currentUser, navigate]);

  if (!currentUser) return null;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 border-b flex items-center gap-3 px-4 sticky top-0 z-10 bg-background/80 backdrop-blur">
            <SidebarTrigger />
            <h1 className="text-sm font-semibold">{titles[path] ?? "TransitOps"}</h1>
            <div className="ml-auto flex items-center gap-2">
              <NotificationsBell />
              <Badge variant="outline" className="text-[10px]">{currentUser.role}</Badge>
              <div className="h-8 w-8 rounded-full bg-primary/20 grid place-items-center text-xs font-semibold">
                {currentUser.name.split(" ").map(n => n[0]).join("").slice(0,2)}
              </div>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-6 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
