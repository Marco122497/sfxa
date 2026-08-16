import { ChurchIcon } from "lucide-react";

import { requireAdmin } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { listChapelMembers, listChapels } from "@/lib/chapels/store";
import { ChapelManager } from "@/components/administrator/chapel-manager";
import { PageHeading } from "@/components/layout/page-heading";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default async function ChapelsPage() {
  await requireAdmin();

  let chapels: Awaited<ReturnType<typeof listChapels>> = [];
  let treasurers: { id: string; full_name: string; role: string }[] = [];
  let members: { id: string; full_name: string; role: string }[] = [];
  let memberAssignments: { chapel_id: number; user_id: string }[] = [];
  let loadError: string | null = null;

  try {
    const admin = createAdminClient();
    const [chapelRows, assignments, { data: profiles }] = await Promise.all([
      listChapels(),
      listChapelMembers(),
      admin
        .from("profiles")
        .select("id, full_name, role, chapel_id")
        .order("full_name"),
    ]);
    chapels = chapelRows;
    treasurers = (profiles ?? []).filter((row) => row.role === "Treasurer");
    members = (profiles ?? []).filter((row) => row.role === "Parish Officer");
    const fromTable = assignments;
    const fromProfiles = (profiles ?? [])
      .filter(
        (row) =>
          row.role === "Parish Officer" && typeof row.chapel_id === "number"
      )
      .map((row) => ({ chapel_id: row.chapel_id as number, user_id: row.id }));
    const seen = new Set<string>();
    memberAssignments = [...fromTable, ...fromProfiles].filter((row) => {
      const key = `${row.chapel_id}:${row.user_id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  } catch (err) {
    loadError = err instanceof Error ? err.message : "Could not load chapels.";
  }

  return (
    <div className="space-y-6">
      <PageHeading
        title="Chapel Access"
        description="Add and manage chapels, assign a Treasurer, and assign Parish Members. Chapel access controls who can work with chapel-based records."
        icon={ChurchIcon}
      />
      {loadError ? (
        <Alert variant="destructive">
          <AlertTitle>Could not load chapels</AlertTitle>
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <ChapelManager
              chapels={chapels}
              treasurers={treasurers}
              members={members}
              memberAssignments={memberAssignments}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
