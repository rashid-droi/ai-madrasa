import type { Metadata } from "next";
import { EmptyState, PageHeader } from "@/components/ui/card";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { isDateString, maxMarkableDate, MIN_DATE, toDbDate } from "@/lib/dates";
import { MARKS_SELECT, marksOf } from "@/lib/marks";
import { GoToToday } from "@/components/go-to-today";
import { MarkingSheet } from "./marking-sheet";

export const metadata: Metadata = { title: "Daily Marking" };

export default async function TeacherPage({ searchParams }: PageProps<"/teacher">) {
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
      records: { where: { date: toDbDate(date) }, select: MARKS_SELECT, take: 1 },
    },
  });

  return (
    <>
      <PageHeader title="Daily Marking" description="Tap a student, tick what they completed, then save." />
      {students.length === 0 ? (
        <EmptyState text="No students are assigned to you yet. Ask the admin to assign your students." />
      ) : (
        <MarkingSheet
          key={date}
          date={date}
          students={students.map((s) => ({
            id: s.id,
            name: s.user.name,
            className: s.className,
            saved: s.records[0] ? marksOf(s.records[0]) : null,
          }))}
        />
      )}
    </>
  );
}
