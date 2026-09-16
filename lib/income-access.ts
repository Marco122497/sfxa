export const INCOME_ACCESS_TYPES = [
  { id: "", label: "Not specified" },
  { id: "public", label: "Public" },
  { id: "private", label: "Private" },
] as const;

export type IncomeAccessType = (typeof INCOME_ACCESS_TYPES)[number]["id"];

export function isIncomeAccessType(
  value: string | undefined
): value is IncomeAccessType {
  return INCOME_ACCESS_TYPES.some((item) => item.id === value);
}

export function parseIncomeAccessType(serviceName: string): {
  baseName: string;
  accessType: "public" | "private" | "";
} {
  const match = String(serviceName ?? "")
    .trim()
    .match(/^(.*?)\s*\((Public|Private)\)$/i);
  if (!match) {
    return { baseName: String(serviceName ?? "").trim(), accessType: "" };
  }
  return {
    baseName: match[1].trim(),
    accessType: match[2].toLowerCase() as "public" | "private",
  };
}

export function incomeAccessTypeLabel(accessType: string) {
  if (accessType === "public") return "Public";
  if (accessType === "private") return "Private";
  return "—";
}

export function generalIncomeServiceName(
  serviceName: string | null | undefined
) {
  const { baseName } = parseIncomeAccessType(serviceName ?? "");
  return baseName || serviceName?.trim() || "Unspecified";
}

export function incomeServiceReportLabel(serviceName: string) {
  const { baseName, accessType } = parseIncomeAccessType(serviceName);
  if (!baseName) return serviceName || "Uncategorized";
  const access = incomeAccessTypeLabel(accessType);
  if (access === "—") return baseName;
  return `${baseName} (${access})`;
}

/** Combine a service name with an optional public/private type. */
export function formatIncomeServiceName(baseName: string, accessType: string) {
  const { baseName: base } = parseIncomeAccessType(baseName);
  if (!base) return "";
  if (accessType === "public") return `${base} (Public)`;
  if (accessType === "private") return `${base} (Private)`;
  return base;
}
