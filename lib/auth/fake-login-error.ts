import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

import { isProtectedAdminAccount, type UserRole } from "@/lib/auth/roles";

const filePath = path.join(process.cwd(), "data", "fake-login-error.json");

const blockedRoles = new Set<UserRole>([
  "Administrator",
  "Treasurer",
  "Parish Officer",
]);

export async function isFakeLoginErrorEnabled() {
  try {
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as { enabled?: boolean };
    return parsed.enabled === true;
  } catch {
    return false;
  }
}

export async function setFakeLoginErrorEnabled(enabled: boolean) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify({ enabled }, null, 2), "utf8");
}

export function isFakeLoginErrorTarget(
  role: string,
  email: string | null | undefined
) {
  if (isProtectedAdminAccount(email)) return false;
  return blockedRoles.has(role as UserRole);
}
