export function formatMoney(value: number | string | null | undefined): string {
  const amount = typeof value === "string" ? Number(value) : (value ?? 0);
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
}

const PARISH_TIME_ZONE = "Asia/Manila";

function parishPart(
  parts: Intl.DateTimeFormatPart[],
  type: Intl.DateTimeFormatPartTypes
) {
  const value = parts.find((part) => part.type === type)?.value ?? "00";
  return value === "24" ? "00" : value;
}

/** Calendar date and clock time in Asia/Manila. */
export function parishDateParts(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: PARISH_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  return {
    year: parishPart(parts, "year"),
    month: parishPart(parts, "month"),
    day: parishPart(parts, "day"),
    hour: parishPart(parts, "hour"),
    minute: parishPart(parts, "minute"),
    second: parishPart(parts, "second"),
  };
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const dateOnly = /^(\d{4}-\d{2}-\d{2})$/.exec(value);
  const date = dateOnly
    ? new Date(`${dateOnly[1]}T00:00:00+08:00`)
    : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-PH", {
    timeZone: PARISH_TIME_ZONE,
    dateStyle: "medium",
  }).format(date);
}

/** Parish clock used when a payment is saved without a typed date or time. */
export function currentParishDateTime(now = new Date()) {
  const parts = parishDateParts(now);
  if (!parts) {
    return { date: "1970-01-01", time: "00:00:00" };
  }
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:${parts.minute}:${parts.second}`,
  };
}

/** A church schedule chosen as parish wall time, stored with an explicit offset. */
export function parishScheduleInstant(date: string, time: string) {
  return `${date}T${time}:00+08:00`;
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
    timeZone: PARISH_TIME_ZONE,
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(`2000-01-01T${value}:00+08:00`));
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
    const date = new Date(`2000-01-01T${clock[1]}:${clock[2]}:00+08:00`);
    return new Intl.DateTimeFormat("en-PH", {
      timeZone: PARISH_TIME_ZONE,
      timeStyle: "short",
    }).format(date);
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return new Intl.DateTimeFormat("en-PH", {
    timeZone: PARISH_TIME_ZONE,
    timeStyle: "short",
  }).format(parsed);
}

export function toDateTimeLocal(value: string | null | undefined) {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return value;
  const parts = parishDateParts(value);
  if (!parts) return "";
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

export function toNumber(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}
