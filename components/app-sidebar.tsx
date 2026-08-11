"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  BanknoteIcon,
  ChevronRightIcon,
  ClipboardListIcon,
  FileTextIcon,
  HandCoinsIcon,
  KeyRoundIcon,
  LayoutDashboardIcon,
  Loader2,
  MegaphoneIcon,
  PiggyBankIcon,
  ReceiptIcon,
  TagsIcon,
  UserRoundIcon,
  UsersIcon,
  WalletIcon,
  ChurchIcon,
} from "lucide-react";

import type { Profile, UserRole } from "@/lib/auth/roles";
import { getDashboardPath } from "@/lib/auth/roles";
import { useNavigationPending } from "@/components/layout/navigation-pending";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";

type NavChild = {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
};

type NavItem = {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: NavChild[];
};

function getNavItems(role: UserRole, home: string): NavItem[] {
  const items: NavItem[] = [
    { title: "Dashboard", url: home, icon: LayoutDashboardIcon },
  ];

  if (role === "Administrator") {
    items.push(
      {
        title: "Financial Management",
        url: "/administrator/finance/donations",
        icon: WalletIcon,
      },
      {
        title: "Budget Management",
        url: "/administrator/finance/budgets",
        icon: PiggyBankIcon,
      },
      {
        title: "Financial Reports",
        url: "/administrator/reports",
        icon: FileTextIcon,
      },
      {
        title: "User Management",
        url: "/administrator/users",
        icon: UsersIcon,
      },
      {
        title: "Categories",
        url: "/administrator/categories/donations",
        icon: TagsIcon,
      },
      {
        title: "Announcements",
        url: "/administrator/announcements",
        icon: MegaphoneIcon,
      },
      {
        title: "Audit Trail",
        url: "/administrator/audit",
        icon: ClipboardListIcon,
      }
    );
  }

  if (role === "Treasurer") {
    items.push(
      {
        title: "Financial Transactions",
        url: "/treasurer/collections",
        icon: WalletIcon,
        children: [
          {
            title: "Collections",
            url: "/treasurer/collections",
            icon: BanknoteIcon,
          },
          {
            title: "Donations",
            url: "/treasurer/donations",
            icon: HandCoinsIcon,
          },
          {
            title: "Expenses",
            url: "/treasurer/expenses",
            icon: ReceiptIcon,
          },
        ],
      },
      {
        title: "Budget Management",
        url: "/treasurer/budgets/allocation",
        icon: PiggyBankIcon,
      },
      {
        title: "Financial Reports",
        url: "/treasurer/reports",
        icon: FileTextIcon,
      },
      {
        title: "Announcements",
        url: "/treasurer/announcements",
        icon: MegaphoneIcon,
      },
      {
        title: "Profile",
        url: "/profile",
        icon: UserRoundIcon,
      },
      {
        title: "Change password",
        url: "/change-password",
        icon: KeyRoundIcon,
      }
    );
    return items;
  }

  if (role === "Parish Officer") {
    items.push(
      {
        title: "Financial Overview",
        url: "/parish-officer/collections",
        icon: WalletIcon,
        children: [
          {
            title: "Collections",
            url: "/parish-officer/collections",
            icon: BanknoteIcon,
          },
          {
            title: "Donations",
            url: "/parish-officer/donations",
            icon: HandCoinsIcon,
          },
          {
            title: "Expenses",
            url: "/parish-officer/expenses",
            icon: ReceiptIcon,
          },
        ],
      },
      {
        title: "Budget Monitoring",
        url: "/parish-officer/budget",
        icon: PiggyBankIcon,
      },
      {
        title: "Financial Reports",
        url: "/parish-officer/reports",
        icon: FileTextIcon,
      },
      {
        title: "Announcements",
        url: "/parish-officer/announcements",
        icon: MegaphoneIcon,
      },
      {
        title: "Profile",
        url: "/profile",
        icon: UserRoundIcon,
      },
      {
        title: "Change password",
        url: "/change-password",
        icon: KeyRoundIcon,
      }
    );
    return items;
  }

  items.push(
    { title: "Profile", url: "/profile", icon: UserRoundIcon },
    { title: "Change password", url: "/change-password", icon: KeyRoundIcon }
  );

  return items;
}

function getPrefetchUrls(role: UserRole, home: string) {
  const urls = [home, "/profile", "/change-password"];
  if (role === "Administrator") {
    urls.push(
      "/administrator/finance/donations",
      "/administrator/finance/collections",
      "/administrator/finance/expenses",
      "/administrator/finance/budgets",
      "/administrator/reports",
      "/administrator/users",
      "/administrator/categories/donations",
      "/administrator/categories/collections",
      "/administrator/categories/expenses",
      "/administrator/announcements",
      "/administrator/audit"
    );
  }
  if (role === "Treasurer") {
    urls.push(
      "/treasurer/collections",
      "/treasurer/donations",
      "/treasurer/expenses",
      "/treasurer/budgets/allocation",
      "/treasurer/budgets/monitoring",
      "/treasurer/budgets/history",
      "/treasurer/reports",
      "/treasurer/announcements"
    );
  }
  if (role === "Parish Officer") {
    urls.push(
      "/parish-officer/collections",
      "/parish-officer/donations",
      "/parish-officer/expenses",
      "/parish-officer/budget",
      "/parish-officer/reports",
      "/parish-officer/announcements"
    );
  }
  return urls;
}

function navGroup(pathname: string) {
  if (
    pathname.startsWith("/administrator/finance/") &&
    !pathname.startsWith("/administrator/finance/budgets")
  ) {
    return "admin-finance";
  }
  if (pathname.startsWith("/administrator/categories")) {
    return "admin-categories";
  }
  if (
    pathname.startsWith("/treasurer/donations") ||
    pathname.startsWith("/treasurer/collections") ||
    pathname.startsWith("/treasurer/expenses")
  ) {
    return "treasurer-transactions";
  }
  if (pathname.startsWith("/treasurer/budgets")) {
    return "treasurer-budgets";
  }
  if (
    pathname.startsWith("/parish-officer/donations") ||
    pathname.startsWith("/parish-officer/collections") ||
    pathname.startsWith("/parish-officer/expenses") ||
    pathname.startsWith("/parish-officer/budget")
  ) {
    return "parish-views";
  }
  return null;
}

function isSoftNavigation(from: string, to: string) {
  const fromGroup = navGroup(from);
  const toGroup = navGroup(to);
  return Boolean(fromGroup && toGroup && fromGroup === toGroup);
}

function isItemActive(pathname: string, itemUrl: string, home: string) {
  if (pathname === itemUrl) return true;

  if (itemUrl.includes("/finance/donations")) {
    return (
      pathname.startsWith("/administrator/finance/") &&
      !pathname.startsWith("/administrator/finance/budgets")
    );
  }

  if (itemUrl.includes("/finance/budgets")) {
    return pathname.startsWith("/administrator/finance/budgets");
  }

  if (itemUrl.startsWith("/administrator/categories")) {
    return pathname.startsWith("/administrator/categories");
  }

  if (itemUrl.startsWith("/treasurer/budgets")) {
    return pathname.startsWith("/treasurer/budgets");
  }

  if (itemUrl === home) {
    return pathname === home;
  }

  return pathname.startsWith(`${itemUrl}/`) || pathname.startsWith(`${itemUrl}?`);
}

function isParentActive(pathname: string, item: NavItem) {
  if (!item.children?.length) return isItemActive(pathname, item.url, "");
  return item.children.some(
    (child) =>
      pathname === child.url ||
      pathname.startsWith(`${child.url}/`) ||
      pathname.startsWith(`${child.url}?`)
  );
}

function CollapsibleNavItem({
  item,
  home,
  activePath,
  isLoading,
  parentActive,
  isPending,
  pendingHref,
  isSoftPending,
  softPendingHref,
  onNavigate,
  onPrefetch,
}: {
  item: NavItem;
  home: string;
  activePath: string;
  isLoading: boolean;
  parentActive: boolean;
  isPending: boolean;
  pendingHref: string | null;
  isSoftPending: boolean;
  softPendingHref: string | null;
  onNavigate: (url: string) => void;
  onPrefetch: (url: string) => void;
}) {
  const [open, setOpen] = useState(parentActive);

  useEffect(() => {
    setOpen(parentActive);
  }, [parentActive]);

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="group/collapsible">
      <SidebarMenuItem>
        <CollapsibleTrigger
          render={
            <SidebarMenuButton
              isActive={parentActive}
              className={isLoading ? "opacity-80" : undefined}
            />
          }
        >
          {isLoading ? (
            <Loader2 className="size-4 shrink-0 animate-spin" />
          ) : (
            <item.icon className="size-4 shrink-0" />
          )}
          <span>{item.title}</span>
          <ChevronRightIcon
            className={`ml-auto size-4 shrink-0 transition-transform duration-200 ${open ? "rotate-90" : ""}`}
          />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {item.children!.map((child) => {
              const childActive = isItemActive(activePath, child.url, home);
              const childLoading =
                (isPending &&
                  pendingHref !== null &&
                  isItemActive(pendingHref, child.url, home)) ||
                (isSoftPending && softPendingHref === child.url);
              const ChildIcon = child.icon;

              return (
                <SidebarMenuSubItem key={child.url}>
                  <SidebarMenuSubButton
                    isActive={childActive}
                    render={<button type="button" />}
                    onMouseEnter={() => onPrefetch(child.url)}
                    onFocus={() => onPrefetch(child.url)}
                    onClick={() => onNavigate(child.url)}
                    className={
                      childLoading
                        ? "w-full cursor-pointer opacity-80"
                        : "w-full cursor-pointer"
                    }
                  >
                    {childLoading ? (
                      <Loader2 className="size-4 shrink-0 animate-spin" />
                    ) : (
                      <ChildIcon className="size-4 shrink-0" />
                    )}
                    <span>{child.title}</span>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              );
            })}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}

export function AppSidebar({
  profile,
  ...props
}: React.ComponentProps<typeof Sidebar> & { profile: Profile }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isMobile, setOpenMobile } = useSidebar();
  const { isPending, pendingHref, navigate } = useNavigationPending();
  const [isSoftPending, startSoftTransition] = useTransition();
  const [softPendingHref, setSoftPendingHref] = useState<string | null>(null);
  const home = getDashboardPath(profile.role);
  const navItems = getNavItems(profile.role, home);

  useEffect(() => {
    for (const url of getPrefetchUrls(profile.role, home)) {
      router.prefetch(url);
    }
  }, [home, profile.role, router]);

  useEffect(() => {
    setSoftPendingHref(null);
  }, [pathname]);

  function onNavigate(url: string) {
    if (isItemActive(pathname, url, home) && pathname === url) return;

    if (isMobile) {
      setOpenMobile(false);
    }

    if (isSoftNavigation(pathname, url)) {
      setSoftPendingHref(url);
      startSoftTransition(() => {
        router.push(url);
      });
      return;
    }

    navigate(url);
  }

  const activePath = pendingHref ?? softPendingHref ?? pathname;

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" onClick={() => onNavigate(home)}>
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <ChurchIcon className="size-4" />
              </div>
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="font-medium">SFXA Finance</span>
                <span className="text-xs text-muted-foreground">
                  v1.0.0.0.1 beta
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarMenu>
            {navItems.map((item) => {
              const hasChildren = Boolean(item.children?.length);
              const parentActive = hasChildren
                ? isParentActive(activePath, item)
                : isItemActive(activePath, item.url, home);
              const isLoading =
                (isPending &&
                  pendingHref !== null &&
                  (hasChildren
                    ? isParentActive(pendingHref, item)
                    : isItemActive(pendingHref, item.url, home))) ||
                (isSoftPending && softPendingHref === item.url);

              if (hasChildren) {
                return (
                  <CollapsibleNavItem
                    key={item.title}
                    item={item}
                    home={home}
                    activePath={activePath}
                    isLoading={isLoading}
                    parentActive={parentActive}
                    isPending={isPending}
                    pendingHref={pendingHref}
                    isSoftPending={isSoftPending}
                    softPendingHref={softPendingHref}
                    onNavigate={onNavigate}
                    onPrefetch={(url) => router.prefetch(url)}
                  />
                );
              }

              return (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    isActive={parentActive}
                    onMouseEnter={() => router.prefetch(item.url)}
                    onFocus={() => router.prefetch(item.url)}
                    onClick={() => onNavigate(item.url)}
                    className={isLoading ? "opacity-80" : undefined}
                  >
                    {isLoading ? (
                      <Loader2 className="size-4 shrink-0 animate-spin" />
                    ) : (
                      <item.icon className="size-4 shrink-0" />
                    )}
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
