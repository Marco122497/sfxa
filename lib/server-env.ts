import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Static lookups so Next.js includes these keys in the Vercel server bundle.
 * Dynamic `process.env[name]` alone can be empty in production.
 */
const STATIC_SERVER_ENV: Record<string, string | undefined> = {
  SEMAPHORE_API_KEY: process.env.SEMAPHORE_API_KEY,
  SEMAPHORE_SENDER_NAME: process.env.SEMAPHORE_SENDER_NAME,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  PASSWORD_RESET_OTP_SECRET: process.env.PASSWORD_RESET_OTP_SECRET,
};

function parseEnvFile(contents: string): Record<string, string> {
  const out: Record<string, string> = {};

  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const eq = line.indexOf("=");
    if (eq <= 0) continue;

    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }

  return out;
}

function envFromFiles(): Record<string, string> {
  if (process.env.VERCEL) return {};

  const merged: Record<string, string> = {};

  for (const name of [".env", ".env.local"]) {
    const filePath = join(process.cwd(), name);
    if (!existsSync(filePath)) continue;
    try {
      Object.assign(merged, parseEnvFile(readFileSync(filePath, "utf8")));
    } catch {
      // Ignore unreadable env files; process.env remains the source of truth.
    }
  }

  return merged;
}

function isPlaceholder(value: string) {
  const lower = value.toLowerCase();
  return (
    lower.startsWith("your-") ||
    lower.includes("your-semaphore") ||
    lower.includes("replace-me")
  );
}

function clean(value: string | undefined) {
  const trimmed = value?.trim() ?? "";
  return trimmed && !isPlaceholder(trimmed) ? trimmed : "";
}

/** Server-only env lookup that works locally and on Vercel. */
export function getServerEnv(name: string): string {
  const fromStatic = clean(STATIC_SERVER_ENV[name]);
  if (fromStatic) return fromStatic;

  const fromProcess = clean(process.env[name]);
  if (fromProcess) return fromProcess;

  return clean(envFromFiles()[name]);
}

export function missingSmsConfigMessage() {
  if (process.env.VERCEL) {
    return "SMS is not configured on the live server. In Vercel → Project Settings → Environment Variables, add SEMAPHORE_API_KEY and SEMAPHORE_SENDER_NAME for Production, then Redeploy.";
  }

  return "SMS is not configured. Add SEMAPHORE_API_KEY to .env.local, then restart the dev server.";
}
