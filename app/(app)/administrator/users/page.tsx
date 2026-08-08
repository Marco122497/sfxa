import { PageHeading } from "@/components/layout/page-heading";
import { UsersIcon } from "lucide-react";
import { requireAdmin } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Profile } from "@/lib/auth/roles";
import { AddUserDialog } from "@/components/administrator/add-user-dialog";
import { UsersTable } from "@/components/administrator/users-table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function AdminUsersPage() {
  const { user } = await requireAdmin();

  let users: Profile[] = [];
  let loadError: string | null = null;

  try {
    const admin = createAdminClient();
    const [{ data, error }, authUsersResult] = await Promise.all([
      admin
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false }),
      admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    ]);

    if (error) {
      loadError = error.message;
    } else {
      const emailById = new Map(
        (authUsersResult.data?.users ?? []).map((authUser) => [
          authUser.id,
          authUser.email ?? null,
        ])
      );
      users = ((data ?? []) as Profile[]).map((profile) => ({
        ...profile,
        email: emailById.get(profile.id) ?? null,
      }));
    }
  } catch {
    loadError =
      "Add SUPABASE_SERVICE_ROLE_KEY (legacy eyJ… service_role JWT) to .env.local to manage users.";
  }

  return (
    <div className="space-y-6">
      <PageHeading
        title="User Management"
        description="Manage user access and roles. Personal information is stored in profiles."
        icon={UsersIcon}
        actions={<AddUserDialog />}
      />

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>
            Search and filter update the table as you type.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadError ? (
            <p className="text-sm text-destructive">{loadError}</p>
          ) : (
            <UsersTable users={users} currentUserId={user.id} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
