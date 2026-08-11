import { PageHeading } from "@/components/layout/page-heading";
import { MegaphoneIcon } from "lucide-react";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import {
  AnnouncementManager,
  type AnnouncementRow,
} from "@/components/administrator/announcement-manager";

export default async function AdminAnnouncementsPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data } = await supabase
    .from("announcements")
    .select(
      "announcement_id, title, content, is_published, published_at, created_at, updated_at"
    )
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <PageHeading
        title="Announcements"
        description="Manage announcements shown to congregational members."
        icon={MegaphoneIcon}
      />
      <AnnouncementManager announcements={(data ?? []) as AnnouncementRow[]} />
    </div>
  );
}
