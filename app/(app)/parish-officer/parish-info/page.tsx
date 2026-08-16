import { MegaphoneIcon } from "lucide-react";

import { requireParishOfficer } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { isParishContentKind } from "@/lib/parish-content";
import { ParishViewPageHeader } from "@/components/parish-officer/parish-view-page-header";
import { PublishedParishList } from "@/components/parish/published-parish-list";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function ParishInformationPage() {
  await requireParishOfficer();
  const supabase = await createClient();
  const { data } = await supabase
    .from("announcements")
    .select(
      "announcement_id, title, content, is_published, published_at, created_at"
    )
    .eq("is_published", true)
    .order("published_at", { ascending: false });

  const items = data ?? [];
  const activities = items.filter((row) =>
    isParishContentKind(row.title, "activity")
  );
  const notices = items.filter((row) =>
    isParishContentKind(row.title, "notice")
  );

  return (
    <div className="space-y-6">
      <ParishViewPageHeader
        title="Parish Information"
        description="View upcoming activities and parish notices. Members cannot create or edit these items."
        icon={MegaphoneIcon}
      />
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Parish Activities</CardTitle>
          <CardDescription>Published by the Administrator.</CardDescription>
        </CardHeader>
        <CardContent>
          <PublishedParishList
            items={activities}
            emptyMessage="No activities yet."
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Parish Notices</CardTitle>
          <CardDescription>Published by the Administrator.</CardDescription>
        </CardHeader>
        <CardContent>
          <PublishedParishList
            items={notices}
            emptyMessage="No notices yet."
          />
        </CardContent>
      </Card>
    </div>
  );
}
