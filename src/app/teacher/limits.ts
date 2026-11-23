import { addDays, maxMarkableDate } from "@/lib/dates";

/** Teachers may set tasks up to 30 days ahead. */
export function maxTaskDate() {
  return addDays(maxMarkableDate(), 30);
}
