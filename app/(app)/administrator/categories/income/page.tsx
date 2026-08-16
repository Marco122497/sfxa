import Link from "next/link";
import { FolderTreeIcon } from "lucide-react";

import { requireAdmin } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSupabaseEnv } from "@/lib/supabase/env";
import {
  INCOME_CATEGORIES,
  classifyIncomeName,
  type IncomeCategoryId,
} from "@/lib/income";
import { CategoryPageHeader } from "@/components/administrator/category-page-header";
import { MissingSchemaNotice } from "@/components/finance/missing-schema-notice";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default async function AdminIncomeCategoriesPage() {
  await requireAdmin();

  let services: {
    service_id: number;
    service_name: string;
    category: string;
    is_active: boolean;
  }[] = [];
  let loadError: string | null = null;
  let projectHost: string | null = null;

  try {
    projectHost = new URL(getSupabaseEnv().url).host;
  } catch {
    projectHost = null;
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("income_services")
      .select("service_id, service_name, category, is_active")
      .order("service_name");

    if (!error) {
      services = data ?? [];
    } else {
      const fallback = await admin
        .from("donation_categories")
        .select("category_id, category_name")
        .order("category_name");

      if (fallback.error) {
        loadError = error.message;
      } else {
        services = (fallback.data ?? []).map((row) => ({
          service_id: row.category_id,
          service_name: row.category_name,
          category: classifyIncomeName(row.category_name),
          is_active: true,
        }));
      }
    }
  } catch (err) {
    loadError =
      err instanceof Error ? err.message : "Could not load income categories.";
  }

  const grouped = INCOME_CATEGORIES.map((category) => ({
    ...category,
    services: services.filter((row) => row.category === category.id),
  }));

  return (
    <div className="space-y-4">
      <CategoryPageHeader
        title="Income Categories"
        description="Main classifications of money received. The Treasurer selects these categories and their services when recording cash inflow."
        icon={FolderTreeIcon}
      />
      {loadError ? (
        <MissingSchemaNotice
          feature="Income Categories"
          detail={loadError}
          projectHost={projectHost}
          script="sql/phase3-categories.sql"
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {grouped.map((category) => (
            <Card key={category.id}>
              <CardHeader>
                <CardTitle>{category.label}</CardTitle>
                <CardDescription>{category.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {category.services.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No income services under this category yet.
                  </p>
                ) : (
                  <ul className="space-y-1.5 text-sm">
                    {category.services.map((service) => (
                      <li
                        key={service.service_id}
                        className="flex items-center justify-between gap-2"
                      >
                        <span>{service.service_name}</span>
                        <span className="text-xs text-muted-foreground">
                          {service.is_active ? "Active" : "Inactive"}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                <Link
                  href={`/administrator/categories/income-services?category=${category.id as IncomeCategoryId}`}
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                >
                  Manage services
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
