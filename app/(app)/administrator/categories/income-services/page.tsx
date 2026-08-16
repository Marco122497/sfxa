import { TagsIcon } from "lucide-react";

import { requireAdmin } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { classifyIncomeName } from "@/lib/income";
import { CategoryPageHeader } from "@/components/administrator/category-page-header";
import { IncomeServiceManager } from "@/components/administrator/income-service-manager";
import { MissingSchemaNotice } from "@/components/finance/missing-schema-notice";
import { Card, CardContent } from "@/components/ui/card";

export default async function AdminIncomeServicesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;

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
      err instanceof Error ? err.message : "Could not load income services.";
  }

  return (
    <div className="space-y-4">
      <CategoryPageHeader
        title="Income Services"
        description="Specific services and types under each income category. The Treasurer selects these when recording collections, donations, church services, and other income."
        icon={TagsIcon}
      />
      {loadError ? (
        <MissingSchemaNotice
          feature="Income Services"
          detail={loadError}
          projectHost={projectHost}
          script="sql/phase3-categories.sql"
        />
      ) : (
        <Card size="sm">
          <CardContent className="px-3 py-0">
            <IncomeServiceManager
              services={services}
              initialCategory={params.category}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
