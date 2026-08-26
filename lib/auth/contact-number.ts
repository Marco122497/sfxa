import { createAdminClient } from "@/lib/supabase/admin";
import { normalizePhMobile, phoneLookupVariants } from "@/lib/sms/semaphore";

type ProfilePhoneRow = {
  id: string;
  contact_number: string | null;
};

function matchesNormalizedPhone(
  storedRaw: string | null | undefined,
  normalized: string,
  variants: string[]
): boolean {
  const stored = String(storedRaw || "").trim();
  if (!stored) return false;
  if (variants.includes(stored)) return true;
  return normalizePhMobile(stored) === normalized;
}

/** Returns true when another profile already uses this mobile number. */
export async function isContactNumberTaken(
  rawPhone: string,
  excludeUserId?: string | null
): Promise<{ taken: boolean; normalized: string | null; error?: string }> {
  const normalized = normalizePhMobile(rawPhone);
  if (!normalized) {
    return {
      taken: false,
      normalized: null,
      error: "Enter a valid Philippine mobile number (e.g. 09XXXXXXXXX).",
    };
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch (err) {
    return {
      taken: false,
      normalized,
      error:
        err instanceof Error
          ? err.message
          : "Unable to check contact number uniqueness.",
    };
  }

  const variants = phoneLookupVariants(normalized);
  const { data, error } = await admin
    .from("profiles")
    .select("id, contact_number")
    .not("contact_number", "is", null);

  if (error) {
    return { taken: false, normalized, error: error.message };
  }

  const taken = ((data ?? []) as ProfilePhoneRow[]).some((row) => {
    if (excludeUserId && row.id === excludeUserId) return false;
    return matchesNormalizedPhone(row.contact_number, normalized, variants);
  });

  return { taken, normalized };
}

export const DUPLICATE_CONTACT_NUMBER_MESSAGE =
  "This mobile number is already registered to another account.";
