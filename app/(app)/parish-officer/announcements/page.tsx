import { formatDateTime } from "@/lib/auth/roles";
import { requireParishOfficer } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeading } from "@/components/layout/page-heading";
import { MegaphoneIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function ParishOfficerAnnouncementsPage() {
  await requireParishOfficer();
  const supabase = await createClient();

  const { data } = await supabase
    .from("announcements")
    .select(
      "announcement_id, title, content, is_published, published_at, created_at"
    )
    .eq("is_published", true)
    .order("published_at", { ascending: false });

  const announcements = data ?? [];

  return (
    <div className="space-y-6">
      <PageHeading
        title="Announcements"
        description="Parish announcements for congregational members and staff."
        icon={MegaphoneIcon}
      />

      {announcements.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No published announcements yet.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {announcements.map((item) => (
            <Card key={item.announcement_id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{item.title}</CardTitle>
                <CardDescription>
                  Published {formatDateTime(item.published_at ?? item.created_at)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                  {item.content}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
