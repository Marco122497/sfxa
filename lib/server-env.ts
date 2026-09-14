import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

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

/** Server-only env lookup that still works if Next did not inline the key. */
export function getServerEnv(name: string): string {
  const fromProcess = process.env[name]?.trim() ?? "";
  if (fromProcess && !isPlaceholder(fromProcess)) return fromProcess;

  const fromFile = envFromFiles()[name]?.trim() ?? "";
  if (fromFile && !isPlaceholder(fromFile)) return fromFile;

  return "";
}
