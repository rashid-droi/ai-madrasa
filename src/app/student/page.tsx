import type { Metadata } from "next";
import { GoToToday } from "@/components/go-to-today";
import { ProgressBar } from "@/components/progress";
import { Card, EmptyState, LinkButton, PageHeader, StatCard } from "@/components/ui/card";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { addDays, formatDate, fromDbDate, isDateString, maxMarkableDate, toDbDate } from "@/lib/dates";
import { ACTIVITIES, countDone, marksOf, PRAYERS, RECORD_SELECT, tasksOf, TOTAL_MARKS } from "@/lib/marks";

export const metadata: Metadata = { title: "Overview" };

const WEEK = 7;

export default async function StudentOverview({ searchParams }: PageProps<"/student">) {
  const user = await requireRole("STUDENT");
  // The student id always comes from the signed-in account, never from the URL.
  const studentId = user.studentId;

  if (!studentId) {
    return (
      <>
        <PageHeader title="Overview" />
        <EmptyState text="Your student profile isn't set up yet. Please contact the madrasa admin." />
      </>
    );
  }

  // "Today" depends on the student's time zone, so the browser picks it.
  const { date } = await searchParams;
  const minDate = addDays(new Date().toISOString().slice(0, 10), -1);
  if (!isDateString(date) || date < minDate || date > maxMarkableDate()) {
    return <GoToToday path="/student" />;
  }

  const weekStart = addDays(date, -(WEEK - 1));
  const [student, records] = await Promise.all([
    db.student.findUnique({
      where: { id: studentId },
      select: { className: true, teacher: { select: { name: true } } },
    }),
    db.dailyRecord.findMany({
      where: { studentId, date: { gte: toDbDate(weekStart), lte: toDbDate(date) } },
      select: { date: true, ...RECORD_SELECT },
    }),
  ]);

  const todayRecord = records.find((r) => fromDbDate(r.date) === date);
  const todayMarks = marksOf(todayRecord);
  const todayTasks = tasksOf(todayRecord);
  const todayDone = countDone(todayMarks);

  const prayerKeys = PRAYERS.map((p) => p.key);
  const activityKeys = ACTIVITIES.map((a) => a.key);
  const weekPrayers = records.reduce((n, r) => n + countDone(marksOf(r), prayerKeys), 0);
  const weekActivities = records.reduce((n, r) => n + countDone(marksOf(r), activityKeys), 0);
  const activeDays = records.filter((r) => countDone(marksOf(r)) > 0).length;

  const assigned = ACTIVITIES.filter((a) => todayTasks[a.key]);

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        title={`Assalamu alaikum, ${user.name}`}
        description={`${student?.className ?? ""}${student?.teacher ? ` · Teacher: ${student.teacher.name}` : ""}`}
      />

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-gray-500">Today · {formatDate(date)}</p>
            <p className="mt-1 text-3xl font-semibold text-gray-900 tabular-nums">
              {todayDone}/{TOTAL_MARKS}
            </p>
          </div>
          <LinkButton href={`/student/today?date=${date}`}>{todayDone ? "Continue ticking" : "Start ticking"}</LinkButton>
        </div>
        <ProgressBar value={todayDone} max={TOTAL_MARKS} className="mt-4" />
        <p className="mt-2 text-xs text-gray-500">
          Prayers {countDone(todayMarks, prayerKeys)}/{PRAYERS.length} · Activities{" "}
          {countDone(todayMarks, activityKeys)}/{ACTIVITIES.length}
        </p>
      </Card>

      <section>
        <h2 className="mb-2 px-1 text-sm font-semibold text-gray-700">Today&apos;s tasks from your teacher</h2>
        {assigned.length === 0 ? (
          <EmptyState text="No tasks set for today yet." />
        ) : (
          <Card padding="none">
            <ul className="divide-y divide-gray-100">
              {assigned.map((a) => (
                <li key={a.key} className="flex items-start justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900">{a.label}</p>
                    <p className="text-sm break-words text-gray-500">{todayTasks[a.key]}</p>
                  </div>
                  {todayMarks[a.key] ? (
                    <span className="shrink-0 rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700">
                      ✓ Done
                    </span>
                  ) : (
                    <span className="shrink-0 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                      Pending
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </Card>
        )}
      </section>

      <section>
        <h2 className="mb-2 px-1 text-sm font-semibold text-gray-700">Last 7 days</h2>
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Days active" value={`${activeDays}/${WEEK}`} />
          <StatCard label="Prayers" value={`${weekPrayers}/${WEEK * PRAYERS.length}`} />
          <StatCard label="Activities" value={`${weekActivities}/${WEEK * ACTIVITIES.length}`} />
        </div>
      </section>
    </div>
  );
}
