import { MegaphoneIcon } from "lucide-react";

import { requireParishOfficer } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { isParishContentKind } from "@/lib/parish-content";
import { ParishViewPageHeader } from "@/components/parish-officer/parish-view-page-header";
import { PublishedParishList } from "@/components/parish/published-parish-list";
import { Card, CardContent } from "@/components/ui/card";

export default async function ParishNoticesPage() {
  await requireParishOfficer();
  const supabase = await createClient();
  const { data } = await supabase
    .from("announcements")
    .select(
      "announcement_id, title, content, is_published, published_at, created_at"
    )
    .eq("is_published", true)
    .order("published_at", { ascending: false });

  const notices = (data ?? []).filter((row) =>
    isParishContentKind(row.title, "notice")
  );

  return (
    <div className="space-y-6">
      <ParishViewPageHeader
        title="Parish Notices"
        description="Published parish notices. Members can view these items but cannot create or edit them."
        icon={MegaphoneIcon}
      />
      <Card>
        <CardContent className="pt-6">
          <PublishedParishList
            items={notices}
            emptyMessage="No parish notices yet."
          />
        </CardContent>
      </Card>
    </div>
  );
}
