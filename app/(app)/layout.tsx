import { AppShell } from "@/components/layout/app-shell";
import type { NavNotification } from "@/components/layout/nav-notifications";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = await requireUser();
  const supabase = await createClient();

  const { data: announcements } = await supabase
    .from("announcements")
    .select("announcement_id, title, content, published_at, created_at")
    .eq("is_published", true)
    .order("published_at", { ascending: false })
    .limit(8);

  const notifications: NavNotification[] = (announcements ?? []).map(
    (row) => ({
      id: row.announcement_id,
      title: row.title,
      content: row.content,
      date: row.published_at || row.created_at,
    })
  );

  return (
    <AppShell profile={profile} notifications={notifications}>
      {children}
    </AppShell>
  );
}
