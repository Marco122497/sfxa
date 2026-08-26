import { createHmac, randomInt, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

import type { createAdminClient } from "@/lib/supabase/admin";

export const OTP_COOKIE = "sfxa_pw_reset_otp";
export const RESET_OK_COOKIE = "sfxa_pw_reset_ok";

export const OTP_TTL_MS = 10 * 60 * 1000;
export const RESET_OK_TTL_MS = 15 * 60 * 1000;

type AdminClient = ReturnType<typeof createAdminClient>;

/** Cookie only identifies the active reset session; OTP lives on profiles. */
type OtpSessionPayload = {
  userId: string;
  email: string;
  phoneNormalized: string;
  phoneMasked: string;
  exp: number;
};

type ResetOkPayload = {
  userId: string;
  email: string;
  exp: number;
};

function signingSecret(): string {
  const key =
    process.env.PASSWORD_RESET_OTP_SECRET?.trim() ||
    process.env.SEMAPHORE_API_KEY?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!key) {
    throw new Error("Missing signing secret for password-reset OTP.");
  }

  return key;
}

function toBase64Url(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function fromBase64Url(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(payloadB64: string): string {
  return createHmac("sha256", signingSecret())
    .update(payloadB64)
    .digest("base64url");
}

function encodeCookie<T extends object>(payload: T): string {
  const payloadB64 = toBase64Url(JSON.stringify(payload));
  return `${payloadB64}.${sign(payloadB64)}`;
}

function decodeCookie<T extends object>(raw: string | undefined): T | null {
  if (!raw) return null;
  const [payloadB64, signature] = raw.split(".");
  if (!payloadB64 || !signature) return null;

  const expected = sign(payloadB64);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return null;
  }

  try {
    const parsed = JSON.parse(fromBase64Url(payloadB64)) as T & { exp?: number };
    if (!parsed.exp || Date.now() > parsed.exp) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function generateOtpCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export function codesMatch(a: string, b: string): boolean {
  const left = Buffer.from(a.padStart(6, "0"));
  const right = Buffer.from(b.padStart(6, "0"));
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export async function saveProfileOtp(
  admin: AdminClient,
  userId: string,
  code: string
) {
  const expiresAt = new Date(Date.now() + OTP_TTL_MS).toISOString();
  const { error } = await admin
    .from("profiles")
    .update({
      otp_code: code,
      otp_expires_at: expiresAt,
      otp_verified_at: null,
    })
    .eq("id", userId);

  if (error) {
    throw new Error(error.message || "Failed to save OTP on profile.");
  }
}

export async function readProfileOtp(admin: AdminClient, userId: string) {
  const { data, error } = await admin
    .from("profiles")
    .select("otp_code, otp_expires_at, otp_verified_at, contact_number")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || "Failed to read OTP from profile.");
  }

  return data;
}

export async function clearProfileOtp(admin: AdminClient, userId: string) {
  const { error } = await admin
    .from("profiles")
    .update({
      otp_code: null,
      otp_expires_at: null,
    })
    .eq("id", userId);

  if (error) {
    throw new Error(error.message || "Failed to clear OTP on profile.");
  }
}

export async function markProfileOtpVerified(
  admin: AdminClient,
  userId: string
) {
  const { error } = await admin
    .from("profiles")
    .update({
      otp_code: null,
      otp_expires_at: null,
      otp_verified_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) {
    throw new Error(error.message || "Failed to mark OTP verified.");
  }
}

export async function clearProfileOtpVerified(
  admin: AdminClient,
  userId: string
) {
  const { error } = await admin
    .from("profiles")
    .update({
      otp_code: null,
      otp_expires_at: null,
      otp_verified_at: null,
    })
    .eq("id", userId);

  if (error) {
    throw new Error(error.message || "Failed to clear OTP verification.");
  }
}

export function isOtpStillValid(expiresAt: string | null | undefined): boolean {
  if (!expiresAt) return false;
  return Date.parse(expiresAt) > Date.now();
}

export function isOtpVerifiedRecently(
  verifiedAt: string | null | undefined
): boolean {
  if (!verifiedAt) return false;
  const ts = Date.parse(verifiedAt);
  if (Number.isNaN(ts)) return false;
  return Date.now() - ts <= RESET_OK_TTL_MS;
}

export async function setOtpSessionCookie(input: {
  userId: string;
  email: string;
  phoneNormalized: string;
  phoneMasked: string;
}) {
  const payload: OtpSessionPayload = {
    userId: input.userId,
    email: input.email.toLowerCase(),
    phoneNormalized: input.phoneNormalized,
    phoneMasked: input.phoneMasked,
    exp: Date.now() + OTP_TTL_MS,
  };

  const jar = await cookies();
  jar.set(OTP_COOKIE, encodeCookie(payload), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: Math.floor(OTP_TTL_MS / 1000),
  });
  jar.delete(RESET_OK_COOKIE);
}

export async function readOtpSessionCookie(): Promise<OtpSessionPayload | null> {
  const jar = await cookies();
  return decodeCookie<OtpSessionPayload>(jar.get(OTP_COOKIE)?.value);
}

export async function setResetOkCookie(input: {
  userId: string;
  email: string;
}) {
  const payload: ResetOkPayload = {
    userId: input.userId,
    email: input.email.toLowerCase(),
    exp: Date.now() + RESET_OK_TTL_MS,
  };

  const jar = await cookies();
  jar.set(RESET_OK_COOKIE, encodeCookie(payload), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: Math.floor(RESET_OK_TTL_MS / 1000),
  });
  jar.delete(OTP_COOKIE);
}

export async function readResetOkCookie(): Promise<ResetOkPayload | null> {
  const jar = await cookies();
  return decodeCookie<ResetOkPayload>(jar.get(RESET_OK_COOKIE)?.value);
}

export async function clearResetOkCookie() {
  const jar = await cookies();
  jar.delete(RESET_OK_COOKIE);
  jar.delete(OTP_COOKIE);
}
