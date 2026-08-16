"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/session";
import {
  encodeParishTitle,
  type ParishContentKind,
} from "@/lib/parish-content";

export type AnnouncementActionState = {
  error?: string;
  success?: string;
};

async function getIp() {
  const headerStore = await headers();
  return (
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerStore.get("x-real-ip") ||
    null
  );
}

function revalidateParishPages() {
  revalidatePath("/administrator/announcements");
  revalidatePath("/administrator/parish");
  revalidatePath("/administrator/parish/activities");
  revalidatePath("/administrator/parish/notices");
  revalidatePath("/parish-officer");
  revalidatePath("/parish-officer/parish-info");
  revalidatePath("/parish-officer/activities");
  revalidatePath("/parish-officer/notices");
  revalidatePath("/treasurer/parish-info");
}

export async function createAnnouncement(
  _prev: AnnouncementActionState,
  formData: FormData
): Promise<AnnouncementActionState> {
  const { supabase, user } = await requireAdmin();

  const title = String(formData.get("title") || "").trim();
  const content = String(formData.get("content") || "").trim();
  const publish = String(formData.get("publish") || "") === "1";
  const kindRaw = String(formData.get("kind") || "notice");
  const kind: ParishContentKind =
    kindRaw === "activity" ? "activity" : "notice";

  if (!title || !content) {
    return { error: "Title and content are required." };
  }

  const storedTitle = encodeParishTitle(kind, title);

  const { data, error } = await supabase
    .from("announcements")
    .insert({
      title: storedTitle,
      content,
      created_by: user.id,
      is_published: publish,
      published_at: publish ? new Date().toISOString() : null,
    })
    .select("announcement_id")
    .single();

  if (error) {
    return { error: error.message };
  }

  await supabase.from("audit_logs").insert({
    user_id: user.id,
    action: "CREATE_ANNOUNCEMENT",
    table_name: "announcements",
    record_id: data.announcement_id,
    description: `Created announcement: ${storedTitle}`,
    ip_address: await getIp(),
  });

  revalidateParishPages();
  return { success: publish ? "Announcement published." : "Announcement saved as draft." };
}

export async function updateAnnouncement(
  _prev: AnnouncementActionState,
  formData: FormData
): Promise<AnnouncementActionState> {
  const { supabase, user } = await requireAdmin();

  const announcementId = Number(formData.get("announcement_id"));
  const title = String(formData.get("title") || "").trim();
  const content = String(formData.get("content") || "").trim();
  const kindRaw = String(formData.get("kind") || "notice");
  const kind: ParishContentKind =
    kindRaw === "activity" ? "activity" : "notice";

  if (!announcementId || !title || !content) {
    return { error: "Title and content are required." };
  }

  const storedTitle = encodeParishTitle(kind, title);

  const { error } = await supabase
    .from("announcements")
    .update({ title: storedTitle, content })
    .eq("announcement_id", announcementId);

  if (error) {
    return { error: error.message };
  }

  await supabase.from("audit_logs").insert({
    user_id: user.id,
    action: "UPDATE_ANNOUNCEMENT",
    table_name: "announcements",
    record_id: announcementId,
    description: `Updated announcement: ${title}`,
    ip_address: await getIp(),
  });

  revalidateParishPages();
  return { success: "Announcement updated." };
}

export async function publishAnnouncement(
  _prev: AnnouncementActionState,
  formData: FormData
): Promise<AnnouncementActionState> {
  const { supabase, user } = await requireAdmin();
  const announcementId = Number(formData.get("announcement_id"));
  const publish = String(formData.get("publish") || "") === "1";

  if (!announcementId) {
    return { error: "Invalid announcement." };
  }

  const { error } = await supabase
    .from("announcements")
    .update({
      is_published: publish,
      published_at: publish ? new Date().toISOString() : null,
    })
    .eq("announcement_id", announcementId);

  if (error) {
    return { error: error.message };
  }

  await supabase.from("audit_logs").insert({
    user_id: user.id,
    action: publish ? "PUBLISH_ANNOUNCEMENT" : "UNPUBLISH_ANNOUNCEMENT",
    table_name: "announcements",
    record_id: announcementId,
    description: `${publish ? "Published" : "Unpublished"} announcement #${announcementId}`,
    ip_address: await getIp(),
  });

  revalidateParishPages();
  return { success: publish ? "Announcement published." : "Announcement unpublished." };
}

export async function deleteAnnouncement(
  _prev: AnnouncementActionState,
  formData: FormData
): Promise<AnnouncementActionState> {
  const { supabase, user } = await requireAdmin();
  const announcementId = Number(formData.get("announcement_id"));

  if (!announcementId) {
    return { error: "Invalid announcement." };
  }

  const { error } = await supabase
    .from("announcements")
    .delete()
    .eq("announcement_id", announcementId);

  if (error) {
    return { error: error.message };
  }

  await supabase.from("audit_logs").insert({
    user_id: user.id,
    action: "DELETE_ANNOUNCEMENT",
    table_name: "announcements",
    record_id: announcementId,
    description: `Deleted announcement #${announcementId}`,
    ip_address: await getIp(),
  });

  revalidateParishPages();
  return { success: "Announcement deleted." };
}
