"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowDownToLineIcon,
  ArrowUpFromLineIcon,
  BanknoteIcon,
  CalendarDaysIcon, 
  ChevronRightIcon,
  ChurchIcon,
  ClipboardListIcon,
  FileTextIcon,
  FolderTreeIcon,
  HandCoinsIcon,
  HeartHandshakeIcon,
  KeyRoundIcon,
  LayoutDashboardIcon,
  Loader2,
  MegaphoneIcon,
  PiggyBankIcon,
  ReceiptIcon,
  SettingsIcon,
  ShieldIcon,
  TagsIcon,
  UserRoundIcon,
  UsersIcon,
  WalletIcon,
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
        title: "Chapel Access",
        url: "/administrator/chapels",
        icon: ChurchIcon,
      },
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
        url: "/administrator/finance/collections",
        icon: WalletIcon,
        children: [
          {
            title: "Collections",
            url: "/administrator/finance/collections",
            icon: BanknoteIcon,
          },
          {
            title: "Donations",
            url: "/administrator/finance/donations",
            icon: HandCoinsIcon,
          },
          {
            title: "Income",
            url: "/administrator/finance/income",
            icon: HeartHandshakeIcon,
          },
          {
            title: "Expenses",
            url: "/administrator/finance/expenses",
            icon: ReceiptIcon,
          },
          {
            title: "Disbursements",
            url: "/administrator/finance/disbursements",
            icon: FileTextIcon,
          },
          {
            title: "Budget",
            url: "/administrator/finance/budgets",
            icon: PiggyBankIcon,
          },
        ],
      },
      {
        title: "Financial Statements",
        url: "/administrator/statements",
        icon: FileTextIcon,
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
        url: "/treasurer/receive/collections",
        icon: ArrowDownToLineIcon,
        children: [
          {
            title: "Collections / Offerings",
            url: "/treasurer/receive/collections",
            icon: BanknoteIcon,
          },
          {
            title: "Donations",
            url: "/treasurer/receive/donations",
            icon: HandCoinsIcon,
          },
          {
            title: "Church Services",
            url: "/treasurer/receive/services",
            icon: HeartHandshakeIcon,
          },
          {
            title: "Other Income",
            url: "/treasurer/receive/other",
            icon: WalletIcon,
          },
        ],
      },
      {
        title: "Release Funds",
        url: "/treasurer/release/expenses",
        icon: ArrowUpFromLineIcon,
        children: [
          {
            title: "Expenses",
            url: "/treasurer/release/expenses",
            icon: ReceiptIcon,
          },
          {
            title: "Disbursements",
            url: "/treasurer/release/disbursements",
            icon: FileTextIcon,
          },
        ],
      },
      {
        title: "Budget",
        url: "/treasurer/budgets/allocation",
        icon: PiggyBankIcon,
      },
      {
        title: "Cash Flow",
        url: "/treasurer/cash-flow",
        icon: WalletIcon,
      },
      {
        title: "Financial Statements",
        url: "/treasurer/statements",
        icon: FileTextIcon,
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
        url: "/parish-officer/transparency/summary",
        icon: WalletIcon,
        children: [
          {
            title: "Financial Summary",
            url: "/parish-officer/transparency/summary",
            icon: ClipboardListIcon,
          },
          {
            title: "Cash Flow Summary",
            url: "/parish-officer/transparency/cash-flow",
            icon: WalletIcon,
          },
          {
            title: "Approved Statements",
            url: "/parish-officer/transparency/statements",
            icon: FileTextIcon,
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
  if (
    pathname === item.url ||
    pathname.startsWith(`${item.url}/`) ||
    pathname.startsWith(`${item.url}?`)
  ) {
    return true;
  }
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
              onMouseEnter={() => onPrefetch(item.url)}
              onFocus={() => onPrefetch(item.url)}
              onClick={() => onNavigate(item.url)}
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
                pendingHref !== null &&
                isItemActive(pendingHref, child.url, home);
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
  const { pendingHref, navigate } = useNavigationPending();
  const home = getDashboardPath(profile.role);
  const navItems = getNavItems(profile.role, home);

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
