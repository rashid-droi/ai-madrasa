// The ten daily marks, shared by the teacher, admin and student views.

export const PRAYERS = [
  { key: "fajr", label: "Fajr" },
  { key: "dhuhr", label: "Dhuhr" },
  { key: "asr", label: "Asr" },
  { key: "maghrib", label: "Maghrib" },
  { key: "isha", label: "Isha" },
] as const;

export const LEARNING = [
  { key: "unitReading", label: "Unit Reading" },
  { key: "quranReading", label: "Quran Reading" },
  { key: "writing", label: "Writing" },
  { key: "dikrByheart", label: "Dikr Byheart" },
  { key: "quranHifz", label: "Quran Hifz" },
] as const;

export type PrayerKey = (typeof PRAYERS)[number]["key"];
export type LearningKey = (typeof LEARNING)[number]["key"];
export type MarkKey = PrayerKey | LearningKey;
export type Marks = Record<MarkKey, boolean>;

export const MARK_KEYS: MarkKey[] = [...PRAYERS, ...LEARNING].map((m) => m.key);
export const TOTAL_MARKS = MARK_KEYS.length;

export function emptyMarks(): Marks {
  return Object.fromEntries(MARK_KEYS.map((k) => [k, false])) as Marks;
}

/** Pick just the mark fields from a record (or all false when there is none). */
export function marksOf(record: Partial<Record<MarkKey, boolean>> | null | undefined): Marks {
  const out = emptyMarks();
  if (record) for (const k of MARK_KEYS) out[k] = record[k] === true;
  return out;
}

export function countDone(marks: Marks, keys: readonly MarkKey[] = MARK_KEYS): number {
  return keys.reduce((n, k) => n + (marks[k] ? 1 : 0), 0);
}

/** Prisma `select` for the ten mark columns. */
export const MARKS_SELECT = Object.fromEntries(MARK_KEYS.map((k) => [k, true])) as Record<MarkKey, true>;
