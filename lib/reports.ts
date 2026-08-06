export const REPORT_PERIODS = [
  { id: "daily", label: "Daily" },
  { id: "weekly", label: "Weekly" },
  { id: "monthly", label: "Monthly" },
  { id: "annual", label: "Annual" },
] as const;

export type ReportPeriod = (typeof REPORT_PERIODS)[number]["id"];

export function isReportPeriod(value: string | undefined): value is ReportPeriod {
  return REPORT_PERIODS.some((item) => item.id === value);
}

export const REPORT_TYPES = [
  { id: "donations", label: "Donations", title: "DONATION REPORT", code: "DR" },
  {
    id: "collections",
    label: "Collections",
    title: "COLLECTION REPORT",
    code: "CR",
  },
  { id: "expenses", label: "Expenses", title: "EXPENSE REPORT", code: "ER" },
  { id: "budget", label: "Budget", title: "BUDGET REPORT", code: "BR" },
] as const;

export type ReportType = (typeof REPORT_TYPES)[number]["id"];

export function isReportType(value: string | undefined): value is ReportType {
  return REPORT_TYPES.some((item) => item.id === value);
}

export function getReportTypeMeta(type: ReportType) {
  return REPORT_TYPES.find((item) => item.id === type)!;
}

export const ADMIN_REPORT_TYPES = [
  {
    id: "summary",
    label: "Financial Summary",
    title: "FINANCIAL SUMMARY REPORT",
    code: "FS",
  },
  {
    id: "donations",
    label: "Donation Report",
    title: "DONATION REPORT",
    code: "DR",
  },
  {
    id: "collections",
    label: "Collection Report",
    title: "COLLECTION REPORT",
    code: "CR",
  },
  {
    id: "expenses",
    label: "Expense Report",
    title: "EXPENSE REPORT",
    code: "ER",
  },
  {
    id: "budget",
    label: "Budget Utilization",
    title: "BUDGET UTILIZATION REPORT",
    code: "BU",
  },
  {
    id: "audit",
    label: "Audit Trail",
    title: "AUDIT TRAIL REPORT",
    code: "AT",
  },
] as const;

export type AdminReportType = (typeof ADMIN_REPORT_TYPES)[number]["id"];

export function isAdminReportType(
  value: string | undefined
): value is AdminReportType {
  return ADMIN_REPORT_TYPES.some((item) => item.id === value);
}

export function getAdminReportTypeMeta(type: AdminReportType) {
  return ADMIN_REPORT_TYPES.find((item) => item.id === type)!;
}

export type AnyReportTypeMeta = {
  id: string;
  label: string;
  title: string;
  code: string;
};

export function getAnyReportTypeMeta(type: string): AnyReportTypeMeta {
  const admin = ADMIN_REPORT_TYPES.find((item) => item.id === type);
  if (admin) return admin;
  const treasurer = REPORT_TYPES.find((item) => item.id === type);
  if (treasurer) return treasurer;
  return {
    id: type,
    label: "Report",
    title: "REPORT",
    code: "RP",
  };
}

/** YYYY-MM-DD in local time */
export function toDateInputValue(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function defaultReportDateRange(now = new Date()) {
  return getReportRangePreset("month", now);
}

export const REPORT_RANGE_PRESETS = [
  { id: "today", label: "Today" },
  { id: "week", label: "This Week" },
  { id: "month", label: "This Month" },
  { id: "annual", label: "Annual" },
] as const;

export type ReportRangePreset = (typeof REPORT_RANGE_PRESETS)[number]["id"];

export function getReportRangePreset(
  preset: ReportRangePreset,
  now = new Date()
) {
  const to = toDateInputValue(now);

  if (preset === "today") {
    return { from: to, to };
  }

  if (preset === "week") {
    const start = new Date(now);
    const day = start.getDay(); // Sunday = 0
    start.setDate(start.getDate() - day);
    return { from: toDateInputValue(start), to };
  }

  if (preset === "month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return { from: toDateInputValue(start), to };
  }

  // annual
  const start = new Date(now.getFullYear(), 0, 1);
  return { from: toDateInputValue(start), to };
}

export function matchReportRangePreset(
  from: string,
  to: string,
  now = new Date()
): ReportRangePreset | null {
  for (const preset of REPORT_RANGE_PRESETS) {
    const range = getReportRangePreset(preset.id, now);
    if (range.from === from && range.to === to) return preset.id;
  }
  return null;
}

export function isValidDateInput(value: string | undefined): value is string {
  if (!value) return false;
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
}

export function resolveReportDateRange(params: {
  from?: string;
  to?: string;
}) {
  const defaults = defaultReportDateRange();
  let from = isValidDateInput(params.from) ? params.from : defaults.from;
  let to = isValidDateInput(params.to) ? params.to : defaults.to;
  if (from > to) {
    const swap = from;
    from = to;
    to = swap;
  }
  return { from, to };
}

export function formatReportPeriodLabel(from: string, to: string) {
  const formatter = new Intl.DateTimeFormat("en-PH", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  return `${formatter.format(new Date(from))} – ${formatter.format(new Date(to))}`;
}

export function formatReportShortDate(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

export function buildReportNumber(type: string, from: string, to: string) {
  const meta = getAnyReportTypeMeta(type);
  const stamp = from.replace(/-/g, "").slice(0, 6);
  const end = to.slice(8, 10);
  return `${meta.code}-${stamp}-${end}`;
}
