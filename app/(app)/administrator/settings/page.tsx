import Link from "next/link";
import { SettingsIcon } from "lucide-react";

import { requireAdmin } from "@/lib/auth/session";
import { PageHeading } from "@/components/layout/page-heading";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default async function AdminSettingsPage() {
  await requireAdmin();

  const links = [
    {
      href: "/administrator/users",
      title: "User Management",
      description: "Administrators, Treasurers, and Parish Members.",
    },
    {
      href: "/administrator/categories/income",
      title: "Income Categories",
      description: "Main classifications of money received.",
    },
    {
      href: "/administrator/categories/income-services",
      title: "Income Services",
      description: "Configurable services used when the Treasurer records income.",
    },
    {
      href: "/administrator/categories/expenses",
      title: "Expense Categories",
      description: "General and specific expense categories used with budget.",
    },
    {
      href: "/profile",
      title: "My profile",
      description: "Update your name and contact details.",
    },
    {
      href: "/change-password",
      title: "Change password",
      description: "Update the password for this administrator account.",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeading
        title="Settings"
        description="System configuration for users and categories."
        icon={SettingsIcon}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        {links.map((item) => (
          <Card key={item.href}>
            <CardHeader>
              <CardTitle>{item.title}</CardTitle>
              <CardDescription>{item.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Link
                href={item.href}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                Open
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
