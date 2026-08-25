"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowDownToLineIcon,
  CalendarDaysIcon, 
  ChevronRightIcon,
  ChurchIcon,
  ClipboardListIcon,
  FolderTreeIcon,
  HeartHandshakeIcon,
  HistoryIcon,
  KeyRoundIcon,
  LayoutDashboardIcon,
  Loader2,
  MegaphoneIcon,
  PiggyBankIcon,
  ReceiptIcon,
  SettingsIcon,
  ShieldIcon,
  TagsIcon,
  TrendingUpIcon,
  UserRoundIcon,
  UsersIcon,
  WalletIcon,
} from "lucide-react";

import type { Profile, UserRole } from "@/lib/auth/roles";
import { getDashboardPath } from "@/lib/auth/roles";
import type { IncomeCategoryRecord } from "@/lib/income-categories";
import { FALLBACK_INCOME_CATEGORIES } from "@/lib/income-categories";
import { getIncomeCategoryIcon } from "@/components/income-category-icon";
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
  children?: NavChild[];
};

type NavItem = {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: NavChild[];
};

function getNavItems(
  role: UserRole,
  home: string,
  incomeCategories: IncomeCategoryRecord[]
): NavItem[] {
  const categories =
    incomeCategories.length > 0
      ? incomeCategories
      : FALLBACK_INCOME_CATEGORIES;
  const items: NavItem[] = [
    { title: "Dashboard", url: home, icon: LayoutDashboardIcon },
  ];

  if (role === "Administrator") {
    const financeChildren: NavChild[] = [
      {
        title: "Income",
        url: "/administrator/finance/income",
        icon: HeartHandshakeIcon,
        children: categories.map((category) => ({
          title: category.name,
          url: `/administrator/finance/${category.code}`,
          icon: getIncomeCategoryIcon(category.code, category.name),
        })),
      },
      {
        title: "Expenses",
        url: "/administrator/finance/expenses",
        icon: ReceiptIcon,
      },
      {
        title: "Budget",
        url: "/administrator/finance/budgets",
        icon: PiggyBankIcon,
      },
    ];
    items.push(
      {
        title: "User Management",
        url: "/administrator/users",
        icon: UsersIcon,
      },
      {
        title: "Parish Information",
        url: "/administrator/parish/activities",
        icon: MegaphoneIcon,
        children: [
          {
            title: "Parish Activities",
            url: "/administrator/parish/activities",
            icon: CalendarDaysIcon,
          },
          {
            title: "Parish Notices",
            url: "/administrator/parish/notices",
            icon: MegaphoneIcon,
          },
        ],
      },
      {
        title: "Categories",
        url: "/administrator/categories/income",
        icon: FolderTreeIcon,
        children: [
          {
            title: "Income Categories",
            url: "/administrator/categories/income",
            icon: FolderTreeIcon,
          },
          {
            title: "Income Services",
            url: "/administrator/categories/income-services",
            icon: TagsIcon,
          },
          {
            title: "Expense Categories",
            url: "/administrator/categories/expenses",
            icon: ReceiptIcon,
          },
        ],
      },
      {
        title: "Financial Monitoring",
        url: "/administrator/finance",
        icon: WalletIcon,
        children: financeChildren,
      },
      {
        title: "Cash Flow",
        url: "/administrator/cash-flow",
        icon: WalletIcon,
      },
      {
        title: "Reports",
        url: "/administrator/reports",
        icon: ClipboardListIcon,
      },
      {
        title: "Audit Logs",
        url: "/administrator/audit",
        icon: ShieldIcon,
      },
      {
        title: "Settings",
        url: "/administrator/settings",
        icon: SettingsIcon,
      }
    );
    return items;
  }

  if (role === "Treasurer") {
    items.push(
      {
        title: "Receive Funds",
        url: "/treasurer/receive",
        icon: ArrowDownToLineIcon,
        children: categories.map((category) => ({
          title: category.name,
          url: `/treasurer/receive/${category.code}`,
          icon: getIncomeCategoryIcon(category.code, category.name),
        })),
      },
      {
        title: "Expenses",
        url: "/treasurer/release/expenses",
        icon: ReceiptIcon,
      },
      {
        title: "Budget",
        url: "/treasurer/budgets/allocation",
        icon: PiggyBankIcon,
        children: [
          {
            title: "Budget Allocation",
            url: "/treasurer/budgets/allocation",
            icon: PiggyBankIcon,
          },
          {
            title: "Budget Monitoring",
            url: "/treasurer/budgets/monitoring",
            icon: TrendingUpIcon,
          },
          {
            title: "Budget History",
            url: "/treasurer/budgets/history",
            icon: HistoryIcon,
          },
        ],
      },
      {
        title: "Cash Flow",
        url: "/treasurer/cash-flow",
        icon: WalletIcon,
      },
      {
        title: "Reports",
        url: "/treasurer/reports",
        icon: ClipboardListIcon,
      },
      {
        title: "Parish Information",
        url: "/treasurer/parish-info",
        icon: MegaphoneIcon,
      },
      {
        title: "My Profile",
        url: "/profile",
        icon: UserRoundIcon,
      }
    );
    return items;
  }

  if (role === "Parish Officer") {
    items.push(
      {
        title: "Parish Information",
        url: "/parish-officer/parish-info",
        icon: MegaphoneIcon,
        children: [
          {
            title: "Upcoming Parish Activities",
            url: "/parish-officer/activities",
            icon: CalendarDaysIcon,
          },
          {
            title: "Parish Notices",
            url: "/parish-officer/notices",
            icon: MegaphoneIcon,
          },
        ],
      },
      {
        title: "Financial Transparency",
        url: "/parish-officer/transparency/cash-flow",
        icon: WalletIcon,
        children: [
          {
            title: "Cash Flow Summary",
            url: "/parish-officer/transparency/cash-flow",
            icon: WalletIcon,
          },
        ],
      },
      {
        title: "My Profile",
        url: "/profile",
        icon: UserRoundIcon,
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

function isItemActive(pathname: string, itemUrl: string, home: string) {
  if (pathname === itemUrl) return true;

  if (itemUrl === home) {
    return pathname === home;
  }

  return pathname.startsWith(`${itemUrl}/`) || pathname.startsWith(`${itemUrl}?`);
}

function isBranchActive(
  pathname: string,
  node: { url: string; children?: NavChild[] },
  home: string
): boolean {
  if (isItemActive(pathname, node.url, home)) return true;
  return Boolean(
    node.children?.some((child) => isBranchActive(pathname, child, home))
  );
}

function isParentActive(pathname: string, item: NavItem) {
  return isBranchActive(pathname, item, "");
}

function prefetchBranch(
  node: { url: string; children?: NavChild[] },
  onPrefetch: (url: string) => void
) {
  onPrefetch(node.url);
  node.children?.forEach((child) => prefetchBranch(child, onPrefetch));
}

function NavSubItem({
  child,
  home,
  activePath,
  pendingHref,
  onNavigate,
  onPrefetch,
}: {
  child: NavChild;
  home: string;
  activePath: string;
  pendingHref: string | null;
  onNavigate: (url: string) => void;
  onPrefetch: (url: string) => void;
}) {
  const nested = Boolean(child.children?.length);
  const branchActive = isBranchActive(activePath, child, home);
  const exactActive = isItemActive(activePath, child.url, home);
  const isLoading =
    pendingHref !== null && isBranchActive(pendingHref, child, home);
  const [open, setOpen] = useState(branchActive);
  const ChildIcon = child.icon;

  useEffect(() => {
    setOpen(branchActive);
  }, [branchActive]);

  if (!nested) {
    return (
      <SidebarMenuSubItem>
        <SidebarMenuSubButton
          isActive={exactActive}
          render={<button type="button" />}
          onMouseEnter={() => onPrefetch(child.url)}
          onFocus={() => onPrefetch(child.url)}
          onClick={() => onNavigate(child.url)}
          className={
            isLoading
              ? "w-full cursor-pointer opacity-80"
              : "w-full cursor-pointer"
          }
        >
          {isLoading ? (
            <Loader2 className="size-4 shrink-0 animate-spin" />
          ) : (
            <ChildIcon className="size-4 shrink-0" />
          )}
          <span>{child.title}</span>
        </SidebarMenuSubButton>
      </SidebarMenuSubItem>
    );
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <SidebarMenuSubItem>
        <div className="flex min-w-0 items-center gap-0.5">
          <SidebarMenuSubButton
            isActive={exactActive}
            render={<button type="button" />}
            onMouseEnter={() => prefetchBranch(child, onPrefetch)}
            onFocus={() => prefetchBranch(child, onPrefetch)}
            onClick={() => onNavigate(child.url)}
            className={
              isLoading
                ? "min-w-0 flex-1 cursor-pointer opacity-80"
                : "min-w-0 flex-1 cursor-pointer"
            }
          >
            {isLoading ? (
              <Loader2 className="size-4 shrink-0 animate-spin" />
            ) : (
              <ChildIcon className="size-4 shrink-0" />
            )}
            <span>{child.title}</span>
          </SidebarMenuSubButton>
          <CollapsibleTrigger
            className="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            aria-label={`Toggle ${child.title}`}
          >
            <ChevronRightIcon
              className={`size-4 transition-transform duration-200 ${open ? "rotate-90" : ""}`}
            />
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent>
          <SidebarMenuSub className="mx-0 translate-x-0 border-l-0 px-0 py-1 pl-3">
            {child.children!.map((grandchild) => (
              <NavSubItem
                key={grandchild.url}
                child={grandchild}
                home={home}
                activePath={activePath}
                pendingHref={pendingHref}
                onNavigate={onNavigate}
                onPrefetch={onPrefetch}
              />
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuSubItem>
    </Collapsible>
  );
}

function CollapsibleNavItem({
  item,
  home,
  activePath,
  isLoading,
  parentActive,
  pendingHref,
  onNavigate,
  onPrefetch,
}: {
  item: NavItem;
  home: string;
  activePath: string;
  isLoading: boolean;
  parentActive: boolean;
  pendingHref: string | null;
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
              onMouseEnter={() => {
                item.children?.forEach((child) =>
                  prefetchBranch(child, onPrefetch)
                );
              }}
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
            {item.children!.map((child) => (
              <NavSubItem
                key={child.url}
                child={child}
                home={home}
                activePath={activePath}
                pendingHref={pendingHref}
                onNavigate={onNavigate}
                onPrefetch={onPrefetch}
              />
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}

export function AppSidebar({
  profile,
  incomeCategories = [],
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  profile: Profile;
  incomeCategories?: IncomeCategoryRecord[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { isMobile, setOpenMobile } = useSidebar();
  const { pendingHref, navigate } = useNavigationPending();
  const home = getDashboardPath(profile.role);
  const navItems = getNavItems(profile.role, home, incomeCategories);

  function onNavigate(url: string) {
    if (pathname === url) return;

    if (isMobile) {
      setOpenMobile(false);
    }

    navigate(url);
  }

  const activePath = pendingHref ?? pathname;

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
                pendingHref !== null &&
                (hasChildren
                  ? isParentActive(pendingHref, item)
                  : isItemActive(pendingHref, item.url, home));

              if (hasChildren) {
                return (
                  <CollapsibleNavItem
                    key={item.title}
                    item={item}
                    home={home}
                    activePath={activePath}
                    isLoading={isLoading}
                    parentActive={parentActive}
                    pendingHref={pendingHref}
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
