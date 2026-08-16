import { MegaphoneIcon } from "lucide-react";

import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { isParishContentKind } from "@/lib/parish-content";
import {
  AnnouncementManager,
  type AnnouncementRow,
} from "@/components/administrator/announcement-manager";
import { PageHeading } from "@/components/layout/page-heading";

export default async function AdminParishNoticesPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase
    .from("announcements")
    .select(
      "announcement_id, title, content, is_published, published_at, created_at, updated_at"
    )
    .order("created_at", { ascending: false });

  const announcements = ((data ?? []) as AnnouncementRow[]).filter((row) =>
    isParishContentKind(row.title, "notice")
  );

  return (
    <div className="space-y-6">
      <PageHeading
        title="Parish Notices"
        description="Create, edit, publish, or remove parish notices. Members and treasurers see published items only."
        icon={MegaphoneIcon}
      />
      <AnnouncementManager announcements={announcements} kind="notice" />
    </div>
  );
}
