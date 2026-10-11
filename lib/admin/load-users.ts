import { createAdminClient } from "@/lib/supabase/admin";
import {
  isBackupAdminAccount,
  type Profile,
} from "@/lib/auth/roles";

export async function loadAdminUsers(viewerEmail?: string | null): Promise<{
  users: Profile[];
  error: string | null;
}> {
  try {
    const admin = createAdminClient();
    const [{ data, error }, authUsersResult] = await Promise.all([
      admin.from("profiles").select("*").order("created_at", { ascending: false }),
      admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    ]);

    if (error) return { users: [], error: error.message };

    const emailById = new Map(
      (authUsersResult.data?.users ?? []).map((authUser) => [
        authUser.id,
        authUser.email ?? null,
      ])
    );

    const users = ((data ?? []) as Profile[]).map((profile) => ({
      ...profile,
      email: emailById.get(profile.id) ?? null,
    }));

    return {
      users: isBackupAdminAccount(viewerEmail)
        ? users
        : users.filter((profile) => !isBackupAdminAccount(profile.email)),
      error: null,
    };
  } catch {
    return {
      users: [],
      error:
        "Add SUPABASE_SERVICE_ROLE_KEY (legacy eyJ… service_role JWT) to .env.local to manage users.",
    };
  }
}
