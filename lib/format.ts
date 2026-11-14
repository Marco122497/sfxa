export function formatMoney(value: number | string | null | undefined): string {
  const amount = typeof value === "string" ? Number(value) : (value ?? 0);
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
  }).format(new Date(value));
}

/** Parish clock used when a payment is saved without a typed date or time. */
export function currentParishDateTime(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const pick = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "00";
  return {
    date: `${pick("year")}-${pick("month")}-${pick("day")}`,
    time: `${pick("hour")}:${pick("minute")}:${pick("second")}`,
  };
}

/** Manila calendar date after today, as YYYY-MM-DD. */
export function parishTomorrow(now = new Date()) {
  const { date } = currentParishDateTime(now);
  const [year, month, day] = date.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + 1));
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${next.getUTCFullYear()}-${pad(next.getUTCMonth() + 1)}-${pad(next.getUTCDate())}`;
}

/** Church service start times, on the hour from 7:00 AM through 4:00 PM. */
export const HOURLY_TIMES = Array.from({ length: 10 }, (_, index) => {
  const hour = index + 7;
  const value = `${String(hour).padStart(2, "0")}:00`;
  const label = new Intl.DateTimeFormat("en-PH", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(2000, 0, 1, hour, 0));
  return { value, label };
});

/** Date and hour of a schedule, such as 2026-11-30T08. */
export function scheduleHourKey(value: string | null | undefined) {
  if (!value) return "";
  const local = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)
    ? value
    : toDateTimeLocal(value);
  const match = local.match(/^(\d{4}-\d{2}-\d{2})T(\d{2})/);
  return match ? `${match[1]}T${match[2]}` : "";
}

export function formatTime(value: string | null | undefined): string {
  if (!value) return "";
  const clock = /^(\d{2}):(\d{2})/.exec(value);
  if (clock && value.length <= 8) {
    const date = new Date();
    date.setHours(Number(clock[1]), Number(clock[2]), 0, 0);
    return new Intl.DateTimeFormat("en-PH", { timeStyle: "short" }).format(date);
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return new Intl.DateTimeFormat("en-PH", { timeStyle: "short" }).format(parsed);
}

export function toDateTimeLocal(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function toNumber(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}
