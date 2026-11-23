import type { Metadata } from "next";
import Link from "next/link";
import { GoToToday } from "@/components/go-to-today";
import { MarksView, ProgressBar } from "@/components/progress";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import type { Prisma } from "@/generated/prisma/client";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate, isDateString, MIN_DATE, toDbDate } from "@/lib/dates";
import { countDone, MARKS_SELECT, marksOf, TOTAL_MARKS } from "@/lib/marks";
import { getStudentFormOptions } from "../students/data";

export const metadata: Metadata = { title: "Records" };

const UNASSIGNED = "none";

function param(v: string | string[] | undefined) {
  return typeof v === "string" ? v.slice(0, 50) : "";
}

export default async function RecordsPage({ searchParams }: PageProps<"/admin/records">) {
  await requireRole("ADMIN");
  const sp = await searchParams;
  const date = param(sp.date);
  const classFilter = param(sp.class);
  const teacherFilter = param(sp.teacher);

  if (!isDateString(date) || date < MIN_DATE) return <GoToToday path="/admin/records" />;

  const where: Prisma.StudentWhereInput = {
    ...(classFilter ? { className: classFilter } : {}),
    ...(teacherFilter ? { teacherId: teacherFilter === UNASSIGNED ? null : teacherFilter } : {}),
  };

  const [{ teachers, classes }, students] = await Promise.all([
    getStudentFormOptions(),
    db.student.findMany({
      where,
      orderBy: [{ className: "asc" }, { user: { name: "asc" } }],
      select: {
        id: true,
        className: true,
        user: { select: { name: true } },
        teacher: { select: { name: true } },
        records: {
          where: { date: toDbDate(date) },
          take: 1,
          select: { ...MARKS_SELECT, teacher: { select: { name: true } } },
        },
      },
    }),
  ]);

  const groups = new Map<string, typeof students>();
  for (const s of students) groups.set(s.className, [...(groups.get(s.className) ?? []), s]);
  const marked = students.filter((s) => s.records.length > 0).length;

  return (
    <>
      <PageHeader title="Records" description={`${formatDate(date)} · ${marked}/${students.length} students marked`} />

      <form method="get" className="mb-6 grid gap-3 sm:grid-cols-[auto_1fr_1fr_auto] sm:items-center">
        <Input type="date" name="date" defaultValue={date} aria-label="Date" required className="sm:w-auto" />
        <Select name="class" defaultValue={classFilter} aria-label="Filter by class">
          <option value="">All classes</option>
          {classes.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
        <Select name="teacher" defaultValue={teacherFilter} aria-label="Filter by teacher">
          <option value="">All teachers</option>
          <option value={UNASSIGNED}>Unassigned</option>
          {teachers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </Select>
        <button
          type="submit"
          className="min-h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-800 hover:bg-gray-50"
        >
          Show
        </button>
      </form>

      {students.length === 0 ? (
        <EmptyState text="No students match these filters." />
      ) : (
        <div className="space-y-6">
          {[...groups].map(([className, list]) => (
            <section key={className}>
              <h2 className="mb-2 px-1 text-sm font-semibold text-gray-700">
                {className} <span className="font-normal text-gray-400">{list.length}</span>
              </h2>
              <div className="space-y-3">
                {list.map((s) => {
                  const record = s.records[0];
                  const marks = record ? marksOf(record) : null;
                  const done = marks ? countDone(marks) : 0;
                  return (
                    <Card key={s.id} className="p-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <Link href={`/admin/students/${s.id}/records`} className="font-medium text-gray-900 hover:text-brand-700">
                            {s.user.name}
                          </Link>
                          <p className="text-xs text-gray-500">
                            {s.teacher ? s.teacher.name : "Unassigned"}
                          </p>
                        </div>
                        {marks ? (
                          <Badge tone="green">
                            {done}/{TOTAL_MARKS}
                          </Badge>
                        ) : (
                          <Badge>Not marked</Badge>
                        )}
                      </div>
                      {marks && (
                        <div className="mt-3 space-y-3">
                          <ProgressBar value={done} max={TOTAL_MARKS} />
                          <MarksView marks={marks} />
                          {record.teacher && (
                            <p className="text-xs text-gray-400">Marked by {record.teacher.name}</p>
                          )}
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
