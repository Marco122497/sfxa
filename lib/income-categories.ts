import { INCOME_CATEGORIES } from "@/lib/income";

export type IncomeCategoryRecord = {
  code: string;
  name: string;
  description: string | null;
};

export type IncomeCategoryIconKind =
  | "donation"
  | "collection"
  | "church_service"
  | "other";

export const FALLBACK_INCOME_CATEGORIES: IncomeCategoryRecord[] =
  INCOME_CATEGORIES.map((item) => ({
    code: item.id,
    name: item.label,
    description: item.description,
  }));

export const FINANCE_RESERVED_KINDS = [
  "income",
  "expenses",
  "budgets",
  "disbursements",
] as const;

const INCOME_KIND_ALIASES = [
  ["donation", "donations"],
  ["collection", "collections"],
  ["church_service", "church_services", "services", "service"],
  ["other_income", "other"],
] as const;

export function isReservedFinanceKind(kind: string) {
  return (FINANCE_RESERVED_KINDS as readonly string[]).includes(kind);
}

export function isCollectionLike(code: string, name?: string | null) {
  const haystack = `${code} ${name ?? ""}`.toLowerCase();
  return haystack.includes("collection") || haystack.includes("offering");
}

export function isDonationLike(code: string, name?: string | null) {
  const haystack = `${code} ${name ?? ""}`.toLowerCase();
  return haystack.includes("donation");
}

export function incomeCategoryIconKind(
  code: string,
  name?: string | null
): IncomeCategoryIconKind {
  if (isDonationLike(code, name)) return "donation";
  if (isCollectionLike(code, name)) return "collection";
  if (
    code === "church_service" ||
    `${code} ${name ?? ""}`.toLowerCase().includes("service")
  ) {
    return "church_service";
  }
  return "other";
}

function aliasesForKind(kind: string): readonly string[] {
  const normalized = kind.trim().toLowerCase();
  const group = INCOME_KIND_ALIASES.find((aliases) =>
    (aliases as readonly string[]).includes(normalized)
  );
  return group ?? [normalized];
}

export function resolveIncomeCategory(
  categories: IncomeCategoryRecord[],
  kind: string
) {
  const normalized = kind.trim().toLowerCase();
  const exact = categories.find(
    (item) => item.code.trim().toLowerCase() === normalized
  );
  if (exact) return exact;

  const aliases = aliasesForKind(normalized);
  const aliasMatch = categories.find((item) =>
    aliases.includes(item.code.trim().toLowerCase())
  );
  if (aliasMatch) return aliasMatch;

  const loose = categories.filter((item) => {
    if (aliases.includes("donation")) return isDonationLike(item.code, item.name);
    if (aliases.includes("collection")) {
      return isCollectionLike(item.code, item.name);
    }
    if (aliases.includes("church_service")) {
      return incomeCategoryIconKind(item.code, item.name) === "church_service";
    }
    if (aliases.includes("other_income")) {
      return incomeCategoryIconKind(item.code, item.name) === "other";
    }
    return false;
  });

  return loose.length === 1 ? loose[0] : null;
}

export type IncomeRecordCopy = {
  kind: string;
  singular: string;
  plural: string;
  showDonor: boolean;
  addLabel: string;
  editLabel: string;
  deleteTitle: string;
  searchPlaceholder: string;
  emptyMessage: string;
  typeLabel: string;
  noTypesMessage: string;
  addDescription: string;
  editDescription: string;
  remarksPlaceholder?: string;
  formKey: string;
  recordedMessage: string;
  updatedMessage: string;
  deletedMessage: string;
};

function capitalize(value: string) {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function singularFromName(name: string) {
  const trimmed = name.trim();
  const lower = trimmed.toLowerCase();
  if (lower.endsWith(" income")) return trimmed;
  if (lower.endsWith("services")) return trimmed.slice(0, -1);
  if (lower.endsWith("ies") && trimmed.length > 3) {
    return `${trimmed.slice(0, -3)}y`;
  }
  if (
    lower.endsWith("ses") ||
    lower.endsWith("xes") ||
    lower.endsWith("zes") ||
    lower.endsWith("ches") ||
    lower.endsWith("shes")
  ) {
    return trimmed.slice(0, -2);
  }
  if (lower.endsWith("s") && !lower.endsWith("ss") && !lower.endsWith("us")) {
    return trimmed.slice(0, -1);
  }
  return trimmed;
}

export function incomeRecordCopy(
  code?: string | null,
  name?: string | null
): IncomeRecordCopy {
  const displayName = name?.trim() || (code ?? "").replace(/_/g, " ") || "record";
  const haystack = `${code ?? ""} ${displayName}`.toLowerCase();
  let singular: string;
  let plural: string;
  let showDonor = false;
  let remarksPlaceholder: string | undefined;

  if (isDonationLike(code ?? "", displayName)) {
    singular = "donation";
    plural = "donations";
    showDonor = true;
  } else if (isCollectionLike(code ?? "", displayName)) {
    singular = "collection";
    plural = "collections";
    remarksPlaceholder = "Optional notes (e.g. envelope count)";
  } else if (
    code === "church_service" ||
    haystack.includes("church service") ||
    haystack.includes("service")
  ) {
    singular = "church service";
    plural = "church services";
    remarksPlaceholder = "Optional notes";
  } else if (code === "other_income" || haystack.includes("other income")) {
    singular = "other income";
    plural = "other income";
    remarksPlaceholder = "Optional notes";
  } else {
    plural = displayName.toLowerCase();
    singular = singularFromName(displayName).toLowerCase();
    remarksPlaceholder = "Optional notes";
  }

  return {
    kind: code || singular.replace(/\s+/g, "_"),
    singular,
    plural,
    showDonor,
    addLabel: `Add ${singular}`,
    editLabel: `Edit ${singular}`,
    deleteTitle: `Delete ${singular}?`,
    searchPlaceholder: `Search ${plural}…`,
    emptyMessage: `No ${plural} yet.`,
    typeLabel: `${capitalize(singular)} type`,
    noTypesMessage: `No ${singular} types found. Add them under Categories → Income Services first.`,
    addDescription: `Choose a ${singular} type from Income Services, then enter the amount.`,
    editDescription: `Update ${singular} details.`,
    remarksPlaceholder,
    formKey: (code || singular).replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "record",
    recordedMessage: `${capitalize(singular)} recorded.`,
    updatedMessage: `${capitalize(singular)} updated.`,
    deletedMessage: `${capitalize(singular)} deleted.`,
  };
}
