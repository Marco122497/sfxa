"use client";

import type { Profile } from "@/lib/auth/roles";
import { getDashboardPath } from "@/lib/auth/roles";
import type { IncomeCategoryRecord } from "@/lib/income-categories";
import { AppSidebar } from "@/components/app-sidebar";
import { AppBreadcrumb } from "@/components/layout/app-breadcrumb";
import { RoutePageSkeleton } from "@/components/layout/route-page-skeleton";
import {
  NavigationPendingProvider,
  useNavigationPending,
} from "@/components/layout/navigation-pending";
import {
  NavNotifications,
  type NavNotification,
} from "@/components/layout/nav-notifications";
import { NavUser } from "@/components/layout/nav-user";
import { ModeToggle } from "@/components/mode-toggle";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

function AppShellContent({
  profile,
  notifications,
  incomeCategories,
  children,
}: {
  profile: Profile;
  notifications: NavNotification[];
  incomeCategories: IncomeCategoryRecord[];
  children: React.ReactNode;
}) {
  const dashboardHref = getDashboardPath(profile.role);
  const { isPending, pendingHref } = useNavigationPending();

  return (
    <>
      <AppSidebar profile={profile} incomeCategories={incomeCategories} />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b bg-background/90 px-3 backdrop-blur">
          <div className="flex min-w-0 items-center gap-2">
            <SidebarTrigger />
            <Separator
              orientation="vertical"
              className="mr-1 data-vertical:h-4 data-vertical:self-auto"
            />
            <AppBreadcrumb
              dashboardHref={dashboardHref}
              incomeCategories={incomeCategories}
            />
          </div>
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <ModeToggle />
            <NavNotifications
              notifications={notifications}
              userId={profile.id}
            />
            <NavUser profile={profile} />
          </div>
        </header>
        <div className="flex min-w-0 flex-1 flex-col gap-4 overflow-x-hidden p-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:p-6">
          {isPending && pendingHref ? (
            <RoutePageSkeleton href={pendingHref} />
          ) : (
            children
          )}
        </div>
      </SidebarInset>
    </>
  );
}

export function AppShell({
  profile,
  notifications = [],
  incomeCategories = [],
  children,
}: {
  profile: Profile;
  notifications?: NavNotification[];
  incomeCategories?: IncomeCategoryRecord[];
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <NavigationPendingProvider>
        <AppShellContent
          profile={profile}
          notifications={notifications}
          incomeCategories={incomeCategories}
        >
          {children}
        </AppShellContent>
      </NavigationPendingProvider>
    </SidebarProvider>
  );
}
