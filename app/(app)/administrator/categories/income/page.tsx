import { FolderTreeIcon } from "lucide-react";

import { requireAdmin } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { CategoryPageHeader } from "@/components/administrator/category-page-header";
import { IncomeCategoryManager } from "@/components/administrator/income-category-manager";
import { MissingSchemaNotice } from "@/components/finance/missing-schema-notice";
import { Card, CardContent } from "@/components/ui/card";

export default async function AdminIncomeCategoriesPage() {
  await requireAdmin();

  let projectHost: string | null = null;
  try {
    projectHost = new URL(getSupabaseEnv().url).host;
  } catch {
    projectHost = null;
  }

  try {
    const admin = createAdminClient();
    const [{ data, error }, { data: services }] = await Promise.all([
      admin
        .from("income_categories")
        .select("income_category_id, category_code, category_name, description")
        .order("category_name"),
      admin.from("income_services").select("category"),
    ]);

    const serviceCount = new Map<string, number>();
    for (const row of services ?? []) {
      const code = String(row.category || "");
      if (!code) continue;
      serviceCount.set(code, (serviceCount.get(code) ?? 0) + 1);
    }

    return (
      <div className="space-y-4">
        <CategoryPageHeader
          title="Income Categories"
          description="Main classifications of money received. Add, edit, or delete categories here. The Treasurer records cash inflow under Income Services in each category."
          icon={FolderTreeIcon}
        />
        {error ? (
          <MissingSchemaNotice
            feature="Income Categories"
            detail={error.message}
            projectHost={projectHost}
            script="sql/phase3-income-categories.sql"
          />
        ) : (
          <Card size="sm">
            <CardContent className="px-3 py-0">
              <IncomeCategoryManager
                categories={(data ?? []).map((row) => ({
                  ...row,
                  service_count: serviceCount.get(row.category_code) ?? 0,
                }))}
              />
            </CardContent>
          </Card>
        )}
      </div>
    );
  } catch (err) {
    const detail =
      err instanceof Error ? err.message : "Could not load income categories.";
    return (
      <div className="space-y-4">
        <CategoryPageHeader
          title="Income Categories"
          description="Main classifications of money received. Add, edit, or delete categories here. The Treasurer records cash inflow under Income Services in each category."
          icon={FolderTreeIcon}
        />
        <MissingSchemaNotice
          feature="Income Categories"
          detail={detail}
          projectHost={projectHost}
          script="sql/phase3-income-categories.sql"
        />
      </div>
    );
  }
}
