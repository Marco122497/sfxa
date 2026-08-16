"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const pageLabels: Record<string, string> = {
  profile: "Profile",
  "change-password": "Change password",
  users: "User Management",
  announcements: "Announcements",
  audit: "Audit Logs",
  reports: "Reports",
  finance: "Financial Monitoring",
  donations: "Donations",
  collections: "Collections / Offerings",
  expenses: "Expenses",
  budgets: "Budget",
  categories: "Categories",
  income: "Income Categories",
  chapels: "Chapel Access",
  treasurers: "Treasurers",
  members: "Parish Members",
  activities: "Parish Activities",
  notices: "Parish Notices",
  parish: "Parish Information",
  transparency: "Financial Transparency",
  summary: "Financial Summary",
  "income-services": "Income Services",
  statements: "Financial Statements",
  settings: "Settings",
  receive: "Receive Funds",
  release: "Release Funds",
  services: "Church Services",
  other: "Other Income",
  disbursements: "Disbursements",
  "cash-flow": "Cash Flow",
  donate: "Donate Online",
  "my-donations": "My Donations",
  history: "Donation History",
  "parish-info": "Parish Information",
};

const dashboardLabels: Record<string, string> = {
  administrator: "Administrator Dashboard",
  treasurer: "Treasurer Dashboard",
  "parish-officer": "Parish Member Dashboard",
};

export function AppBreadcrumb({ dashboardHref }: { dashboardHref: string }) {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const root = segments[0] ?? "";
  const isDashboard = pathname === dashboardHref;

  if (isDashboard) {
    return (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>{dashboardLabels[root] ?? "Dashboard"}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );
  }

  const dashboardLabel =
    dashboardLabels[dashboardHref.replace("/", "")] ?? "Dashboard";
  const leaf = segments[segments.length - 1] ?? "";
  let pageLabel =
    pageLabels[leaf] ||
    pageLabels[segments[1] ?? ""] ||
    leaf.replace(/-/g, " ");
  if (leaf === "income" && segments.includes("finance")) {
    pageLabel = "Income";
  }
  if (leaf === "income" && segments.includes("categories")) {
    pageLabel = "Income Categories";
  }
  if (leaf === "activities" && segments[0] === "parish-officer") {
    pageLabel = "Upcoming Parish Activities";
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem className="hidden md:block">
          <BreadcrumbLink render={<Link href={dashboardHref} />}>
            {dashboardLabel}
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator className="hidden md:block" />
        <BreadcrumbItem>
          <BreadcrumbPage className="capitalize">{pageLabel}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
