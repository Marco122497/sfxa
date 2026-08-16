import { createAdminClient } from "@/lib/supabase/admin";

export type ChapelRow = {
  chapel_id: number;
  chapel_name: string;
  location: string | null;
  is_active: boolean;
  treasurer_id: string | null;
};

const MISSING_TABLE_HINT =
  "The chapels table is not in this database yet. Run sql/phase2-admin.sql in the Supabase SQL Editor (same project as this app), then reload Chapel Access.";

function isMissingTable(message: string) {
  const lower = message.toLowerCase();
  return (
    lower.includes("schema cache") ||
    lower.includes("could not find the table") ||
    lower.includes("does not exist") ||
    (lower.includes("relation") && lower.includes("chapels"))
  );
}

function chapelError(message: string) {
  return new Error(isMissingTable(message) ? MISSING_TABLE_HINT : message);
}

async function trySetProfileChapel(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  chapelId: number | null
) {
  const { error } = await admin
    .from("profiles")
    .update({ chapel_id: chapelId })
    .eq("id", userId);
  if (error && !isMissingTable(error.message)) {
    throw new Error(error.message);
  }
}

export async function listChapelMembers(): Promise<
  { chapel_id: number; user_id: string }[]
> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("chapel_members")
    .select("chapel_id, user_id");
  if (error) {
    if (isMissingTable(error.message)) return [];
    throw chapelError(error.message);
  }
  return data ?? [];
}

export async function listChapels(): Promise<ChapelRow[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("chapels")
    .select("chapel_id, chapel_name, location, is_active, treasurer_id")
    .order("chapel_name");
  if (error) throw chapelError(error.message);
  return data ?? [];
}

export async function insertChapel(input: {
  chapel_name: string;
  location: string | null;
}) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("chapels")
    .insert({
      chapel_name: input.chapel_name,
      location: input.location,
      is_active: true,
    })
    .select("chapel_id")
    .single();
  if (error) throw chapelError(error.message);
  if (!data?.chapel_id) {
    throw new Error("Chapel was not saved to the database. Check the chapels table and try again.");
  }
}

export async function updateChapelDetails(input: {
  chapel_id: number;
  chapel_name: string;
  location: string | null;
  is_active: boolean;
}) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("chapels")
    .update({
      chapel_name: input.chapel_name,
      location: input.location,
      is_active: input.is_active,
      updated_at: new Date().toISOString(),
    })
    .eq("chapel_id", input.chapel_id)
    .select("chapel_id");
  if (error) throw chapelError(error.message);
  if (!data?.length) {
    throw new Error("Chapel was not updated in the database. Refresh and try again.");
  }
}

export async function removeChapel(chapelId: number) {
  const admin = createAdminClient();
  const { error } = await admin.from("chapels").delete().eq("chapel_id", chapelId);
  if (error) throw chapelError(error.message);
}

export async function assignChapelTreasurer(input: {
  chapel_id: number;
  treasurer_id: string | null;
}) {
  const admin = createAdminClient();
  const { data: current, error: loadError } = await admin
    .from("chapels")
    .select("treasurer_id")
    .eq("chapel_id", input.chapel_id)
    .maybeSingle();
  if (loadError) throw chapelError(loadError.message);

  const { data, error } = await admin
    .from("chapels")
    .update({
      treasurer_id: input.treasurer_id,
      updated_at: new Date().toISOString(),
    })
    .eq("chapel_id", input.chapel_id)
    .select("chapel_id");
  if (error) throw chapelError(error.message);
  if (!data?.length) {
    throw new Error("Treasurer was not updated in the database.");
  }

  const previousId = current?.treasurer_id ?? null;
  if (previousId && previousId !== input.treasurer_id) {
    await trySetProfileChapel(admin, previousId, null);
  }
  if (input.treasurer_id) {
    await trySetProfileChapel(admin, input.treasurer_id, input.chapel_id);
  }
}

export async function addChapelMember(input: {
  chapel_id: number;
  user_id: string;
}) {
  const admin = createAdminClient();
  const { error } = await admin.from("chapel_members").upsert(
    {
      chapel_id: input.chapel_id,
      user_id: input.user_id,
    },
    { onConflict: "chapel_id,user_id" }
  );
  if (error) throw chapelError(error.message);
  await trySetProfileChapel(admin, input.user_id, input.chapel_id);
}

export async function removeChapelMember(input: {
  chapel_id: number;
  user_id: string;
}) {
  const admin = createAdminClient();
  const { error } = await admin
    .from("chapel_members")
    .delete()
    .eq("chapel_id", input.chapel_id)
    .eq("user_id", input.user_id);
  if (error) throw chapelError(error.message);

  const { data: profile } = await admin
    .from("profiles")
    .select("chapel_id")
    .eq("id", input.user_id)
    .maybeSingle();
  if (profile?.chapel_id === input.chapel_id) {
    await trySetProfileChapel(admin, input.user_id, null);
  }
}
