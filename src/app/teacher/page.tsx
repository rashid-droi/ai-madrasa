import type { Metadata } from "next";
import Link from "next/link";
import { GoToToday } from "@/components/go-to-today";
import { ProgressBar } from "@/components/progress";
import { Badge, Card, EmptyState, LinkButton, PageHeader, StatCard } from "@/components/ui/card";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate, isDateString, maxMarkableDate, MIN_DATE, toDbDate } from "@/lib/dates";
import { countDone, marksOf, RECORD_SELECT, tasksOf, TOTAL_MARKS } from "@/lib/marks";

export const metadata: Metadata = { title: "Overview" };

export default async function TeacherOverview({ searchParams }: PageProps<"/teacher">) {
  const teacher = await requireRole("TEACHER");
  const { date } = await searchParams;

  // "Today" depends on the teacher's time zone, so the browser picks it.
  if (!isDateString(date) || date < MIN_DATE || date > maxMarkableDate()) {
    return <GoToToday path="/teacher" />;
  }

  const students = await db.student.findMany({
    where: { teacherId: teacher.id },
    orderBy: [{ className: "asc" }, { user: { name: "asc" } }],
    select: {
      id: true,
      className: true,
      user: { select: { name: true } },
      records: { where: { date: toDbDate(date) }, select: RECORD_SELECT, take: 1 },
    },
  });

  const rows = students.map((s) => {
    const marks = marksOf(s.records[0]);
    const tasks = tasksOf(s.records[0]);
    return {
      id: s.id,
      name: s.user.name,
      className: s.className,
      done: countDone(marks),
      hasTasks: Object.values(tasks).some(Boolean),
    };
  });

  const tasksSet = rows.filter((r) => r.hasTasks).length;
  const ticked = rows.filter((r) => r.done > 0).length;
  const complete = rows.filter((r) => r.done === TOTAL_MARKS).length;
  const tasksHref = `/teacher/tasks?date=${date}`;

  return (
    <>
      <PageHeader
        title={`Assalamu alaikum, ${teacher.name}`}
        description={`${formatDate(date)} · your class at a glance`}
        action={<LinkButton href={tasksHref}>Set today&apos;s tasks</LinkButton>}
      />

      {rows.length === 0 ? (
        <EmptyState text="No students are assigned to you yet. Ask the admin to assign your students." />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="My students" value={rows.length} />
            <StatCard label="Tasks set today" value={`${tasksSet}/${rows.length}`} />
            <StatCard label="Ticked today" value={`${ticked}/${rows.length}`} hint="Students who ticked anything" />
            <StatCard label="All done" value={`${complete}/${rows.length}`} hint={`Ticked all ${TOTAL_MARKS} items`} />
          </div>

          <section>
            <h2 className="mb-2 px-1 text-sm font-semibold text-gray-700">Today&apos;s students</h2>
            <Card padding="none">
              <ul className="divide-y divide-gray-100">
                {rows.map((r) => (
                  <li key={r.id}>
                    <Link href={tasksHref} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate font-medium text-gray-900">{r.name}</p>
                          {r.hasTasks ? <Badge tone="green">Tasks set</Badge> : <Badge>No tasks</Badge>}
                        </div>
                        <p className="text-xs text-gray-500">{r.className}</p>
                      </div>
                      <div className="flex w-32 shrink-0 items-center gap-2 sm:w-44">
                        <ProgressBar value={r.done} max={TOTAL_MARKS} className="flex-1" />
                        <span className="w-10 text-right text-xs font-medium text-gray-600 tabular-nums">
                          {r.done}/{TOTAL_MARKS}
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          </section>
        </div>
      )}
    </>
  );
}
