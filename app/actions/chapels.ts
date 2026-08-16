"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/session";
import {
  addChapelMember,
  assignChapelTreasurer,
  insertChapel,
  removeChapel,
  removeChapelMember,
  updateChapelDetails,
} from "@/lib/chapels/store";

export type ChapelActionState = {
  error?: string;
  success?: string;
};

function revalidateChapels() {
  revalidatePath("/administrator/chapels");
  revalidatePath("/administrator/users");
  revalidatePath("/administrator/users/treasurers");
  revalidatePath("/administrator/users/members");
}

export async function createChapel(
  _prev: ChapelActionState,
  formData: FormData
): Promise<ChapelActionState> {
  await requireAdmin();
  const chapel_name = String(formData.get("chapel_name") || "").trim();
  const location = String(formData.get("location") || "").trim() || null;
  if (!chapel_name) return { error: "Chapel name is required." };

  try {
    await insertChapel({ chapel_name, location });
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not add chapel.",
    };
  }
  revalidateChapels();
  return { success: "Chapel added." };
}

export async function updateChapel(
  _prev: ChapelActionState,
  formData: FormData
): Promise<ChapelActionState> {
  await requireAdmin();
  const chapel_id = Number(formData.get("chapel_id"));
  const chapel_name = String(formData.get("chapel_name") || "").trim();
  const location = String(formData.get("location") || "").trim() || null;
  const is_active = String(formData.get("is_active") || "1") === "1";
  if (!chapel_id || !chapel_name) return { error: "Chapel name is required." };

  try {
    await updateChapelDetails({
      chapel_id,
      chapel_name,
      location,
      is_active,
    });
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not update chapel.",
    };
  }
  revalidateChapels();
  return { success: "Chapel updated." };
}

export async function assignChapelTreasurerAction(
  _prev: ChapelActionState,
  formData: FormData
): Promise<ChapelActionState> {
  await requireAdmin();
  const chapel_id = Number(formData.get("chapel_id"));
  const treasurer_id = String(formData.get("treasurer_id") || "").trim() || null;
  if (!chapel_id) return { error: "Missing chapel." };
  if (!treasurer_id) return { error: "Select a treasurer." };

  try {
    await assignChapelTreasurer({ chapel_id, treasurer_id });
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Could not assign treasurer.",
    };
  }
  revalidateChapels();
  return { success: "Treasurer assigned." };
}

export async function unassignChapelTreasurerAction(
  _prev: ChapelActionState,
  formData: FormData
): Promise<ChapelActionState> {
  await requireAdmin();
  const chapel_id = Number(formData.get("chapel_id"));
  if (!chapel_id) return { error: "Missing chapel." };

  try {
    await assignChapelTreasurer({ chapel_id, treasurer_id: null });
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Could not remove treasurer.",
    };
  }
  revalidateChapels();
  return { success: "Treasurer removed." };
}

export async function assignChapelMember(
  _prev: ChapelActionState,
  formData: FormData
): Promise<ChapelActionState> {
  await requireAdmin();
  const chapel_id = Number(formData.get("chapel_id"));
  const user_id = String(formData.get("user_id") || "").trim();
  if (!chapel_id || !user_id) return { error: "Select a chapel and user." };

  try {
    await addChapelMember({ chapel_id, user_id });
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not assign member.",
    };
  }
  revalidateChapels();
  return { success: "Parish member assigned." };
}

export async function unassignChapelMemberAction(
  _prev: ChapelActionState,
  formData: FormData
): Promise<ChapelActionState> {
  await requireAdmin();
  const chapel_id = Number(formData.get("chapel_id"));
  const user_id = String(formData.get("user_id") || "").trim();
  if (!chapel_id || !user_id) return { error: "Missing member." };

  try {
    await removeChapelMember({ chapel_id, user_id });
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not remove member.",
    };
  }
  revalidateChapels();
  return { success: "Parish member removed." };
}

export async function deleteChapel(
  _prev: ChapelActionState,
  formData: FormData
): Promise<ChapelActionState> {
  await requireAdmin();
  const chapel_id = Number(formData.get("chapel_id"));
  if (!chapel_id) return { error: "Missing chapel." };

  try {
    await removeChapel(chapel_id);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not delete chapel.",
    };
  }
  revalidateChapels();
  return { success: "Chapel deleted." };
}
