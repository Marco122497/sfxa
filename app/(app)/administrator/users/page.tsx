import { UsersIcon } from "lucide-react";

import { requireAdmin } from "@/lib/auth/session";
import { loadAdminUsers } from "@/lib/admin/load-users";
import { AddUserDialog } from "@/components/administrator/add-user-dialog";
import { UsersTable } from "@/components/administrator/users-table";
import { PageHeading } from "@/components/layout/page-heading";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function AdminUsersPage() {
  const { user } = await requireAdmin();
  const { users, error } = await loadAdminUsers();

  return (
    <div className="space-y-6">
      <PageHeading
        title="User Management"
        description="Create and manage Administrators, Treasurers, and Parish Members."
        icon={UsersIcon}
        actions={<AddUserDialog />}
      />
      <Card>
        <CardHeader>
          <CardTitle>Accounts</CardTitle>
          <CardDescription>
            Create and manage Administrators, Treasurers, and Parish Members.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : (
            <UsersTable users={users} currentUserId={user.id} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
