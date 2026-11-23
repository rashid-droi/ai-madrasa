// Read-only month view of one student's daily records.
// Callers are responsible for authorization: pass only a studentId the
// current user is allowed to see.
import "server-only";
import Link from "next/link";
import { MarksView, ProgressBar } from "@/components/progress";
import { Card, EmptyState } from "@/components/ui/card";
import { db } from "@/lib/db";
import { formatDate, fromDbDate, maxMarkableDate } from "@/lib/dates";
import { ACTIVITIES, countDone, marksOf, PRAYERS, RECORD_SELECT, tasksOf, tickTimesOf, TOTAL_MARKS } from "@/lib/marks";

const MONTH_RE = /^(\d{4})-(0[1-9]|1[0-2])$/;

export function isMonthString(v: unknown): v is string {
  return typeof v === "string" && MONTH_RE.test(v) && v >= "2000-01";
}

function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return d.toISOString().slice(0, 7);
}

function monthLabel(month: string): string {
  return new Date(`${month}-01T00:00:00Z`).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/**
 * Month to show when none is requested: the month of the latest record,
 * so a just-marked day is always visible regardless of time zones.
 */
export async function defaultMonth(studentId: string): Promise<string> {
  const latest = await db.dailyRecord.findFirst({
    where: { studentId },
    orderBy: { date: "desc" },
    select: { date: true },
  });
  return (latest ? latest.date : new Date()).toISOString().slice(0, 7);
}

export async function RecordHistory({
  studentId,
  month,
  basePath,
}: {
  studentId: string;
  month: string;
  basePath: string;
}) {
  const start = new Date(`${month}-01T00:00:00.000Z`);
  const end = new Date(`${shiftMonth(month, 1)}-01T00:00:00.000Z`);

  const records = await db.dailyRecord.findMany({
    where: { studentId, date: { gte: start, lt: end } },
    orderBy: { date: "desc" },
    select: { date: true, ...RECORD_SELECT },
  });

  const rows = records.map((r) => ({
    date: fromDbDate(r.date),
    marks: marksOf(r),
    times: tickTimesOf(r),
    tasks: tasksOf(r),
  }));
  const prayerKeys = PRAYERS.map((p) => p.key);
  const activityKeys = ACTIVITIES.map((a) => a.key);
  const prayersDone = rows.reduce((n, r) => n + countDone(r.marks, prayerKeys), 0);
  const activitiesDone = rows.reduce((n, r) => n + countDone(r.marks, activityKeys), 0);

  const lastMonth = maxMarkableDate().slice(0, 7);
  const next = shiftMonth(month, 1);

  return (
    <div className="space-y-4">
      {/* Month switcher */}
      <div className="flex items-center justify-between gap-2">
        <Link
          href={`${basePath}?month=${shiftMonth(month, -1)}`}
          aria-label="Previous month"
          className="inline-flex min-h-11 w-11 items-center justify-center rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50"
        >
          ‹
        </Link>
        <p className="font-semibold text-gray-900">{monthLabel(month)}</p>
        {next <= lastMonth ? (
          <Link
            href={`${basePath}?month=${next}`}
            aria-label="Next month"
            className="inline-flex min-h-11 w-11 items-center justify-center rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50"
          >
            ›
          </Link>
        ) : (
          <span className="w-11" />
        )}
      </div>

      {/* Month summary */}
      <div className="grid grid-cols-3 gap-3">
        <Summary label="Days recorded" value={String(rows.length)} />
        <Summary label="Prayers" value={rows.length ? `${prayersDone}/${rows.length * PRAYERS.length}` : "–"} />
        <Summary label="Activities" value={rows.length ? `${activitiesDone}/${rows.length * ACTIVITIES.length}` : "–"} />
      </div>

      {rows.length === 0 ? (
        <EmptyState text="No records for this month." />
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => {
            const done = countDone(r.marks);
            return (
              <li key={r.date}>
                <Card className="p-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="font-medium text-gray-900">{formatDate(r.date)}</p>
                    <span
                      className={`text-sm font-semibold tabular-nums ${done === TOTAL_MARKS ? "text-brand-700" : "text-gray-600"}`}
                    >
                      {done}/{TOTAL_MARKS}
                    </span>
                  </div>
                  <ProgressBar value={done} max={TOTAL_MARKS} className="mb-3" />
                  <MarksView date={r.date} marks={r.marks} times={r.times} tasks={r.tasks} />
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-3 text-center">
      <p className="text-lg font-semibold text-gray-900 tabular-nums">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </Card>
  );
}
