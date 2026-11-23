// The daily items, shared by the student, teacher and admin views.
// Students tick every item; teachers can write a task for each activity.

export const PRAYERS = [
  { key: "fajr", label: "Fajr" },
  { key: "dhuhr", label: "Dhuhr" },
  { key: "asr", label: "Asr" },
  { key: "maghrib", label: "Maghrib" },
  { key: "isha", label: "Isha" },
] as const;

export const ACTIVITIES = [
  { key: "homework", label: "Homework", placeholder: "e.g. Finish exercise 3" },
  { key: "unitReading", label: "Unit Reading", placeholder: "e.g. Unit 4, page 12" },
  { key: "quranReading", label: "Quran Reading", placeholder: "e.g. Juz 2, pages 22–23" },
  { key: "writing", label: "Writing", placeholder: "e.g. Write Surah Al-Ikhlas" },
  { key: "dikrByheart", label: "Dikr Byheart", placeholder: "e.g. Morning adhkar" },
  { key: "quranHifz", label: "Quran Hifz", placeholder: "e.g. Surah Al-Mulk 1–10" },
] as const;

export type PrayerKey = (typeof PRAYERS)[number]["key"];
export type ActivityKey = (typeof ACTIVITIES)[number]["key"];
export type MarkKey = PrayerKey | ActivityKey;
export type Marks = Record<MarkKey, boolean>;
/** When each item was ticked (ISO string), or null. */
export type TickTimes = Record<MarkKey, string | null>;
/** Teacher-written task per activity. */
export type Tasks = Record<ActivityKey, string | null>;

export const MARK_KEYS: MarkKey[] = [...PRAYERS, ...ACTIVITIES].map((m) => m.key);
export const ACTIVITY_KEYS: ActivityKey[] = ACTIVITIES.map((a) => a.key);
export const TOTAL_MARKS = MARK_KEYS.length;

export const atField = <K extends MarkKey>(k: K) => `${k}At` as `${K}At`;
export const taskField = <K extends ActivityKey>(k: K) => `${k}Task` as `${K}Task`;

export function emptyMarks(): Marks {
  return Object.fromEntries(MARK_KEYS.map((k) => [k, false])) as Marks;
}

type RecordLike = Partial<Record<string, unknown>> | null | undefined;

/** Pick just the tick booleans from a record (all false when there is none). */
export function marksOf(record: RecordLike): Marks {
  const out = emptyMarks();
  if (record) for (const k of MARK_KEYS) out[k] = record[k] === true;
  return out;
}

export function tickTimesOf(record: RecordLike): TickTimes {
  return Object.fromEntries(
    MARK_KEYS.map((k) => {
      const v = record?.[atField(k)];
      return [k, v instanceof Date ? v.toISOString() : null];
    }),
  ) as TickTimes;
}

export function tasksOf(record: RecordLike): Tasks {
  return Object.fromEntries(
    ACTIVITY_KEYS.map((k) => {
      const v = record?.[taskField(k)];
      return [k, typeof v === "string" && v ? v : null];
    }),
  ) as Tasks;
}

export function countDone(marks: Marks, keys: readonly MarkKey[] = MARK_KEYS): number {
  return keys.reduce((n, k) => n + (marks[k] ? 1 : 0), 0);
}

/** Prisma `select` for every tick, tick time and task column. */
export const RECORD_SELECT = Object.fromEntries([
  ...MARK_KEYS.flatMap((k) => [
    [k, true],
    [atField(k), true],
  ]),
  ...ACTIVITY_KEYS.map((k) => [taskField(k), true]),
]) as { [K in MarkKey | `${MarkKey}At` | `${ActivityKey}Task`]: true };
