// Dates are handled as plain "YYYY-MM-DD" strings (calendar days, no time zone).
// They are stored in a PostgreSQL DATE column via a UTC-midnight Date object.

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isDateString(value: unknown): value is string {
  if (typeof value !== "string" || !DATE_RE.test(value)) return false;
  const d = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

/** "YYYY-MM-DD" → Date for a Prisma @db.Date column. */
export function toDbDate(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

/** Date from a @db.Date column → "YYYY-MM-DD". */
export function fromDbDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(value: string, days: number): string {
  const d = toDbDate(value);
  d.setUTCDate(d.getUTCDate() + days);
  return fromDbDate(d);
}

/** Latest date that may be marked: one day past today's UTC date covers every time zone. */
export function maxMarkableDate(): string {
  return addDays(new Date().toISOString().slice(0, 10), 1);
}

/** Earliest date accepted anywhere in the app. */
export const MIN_DATE = "2000-01-01";

/** e.g. "Mon, 23 Nov 2026" */
export function formatDate(value: string): string {
  return toDbDate(value).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Today's date in the browser's own time zone (client components only). */
export function localToday(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}
