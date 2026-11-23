import type { Metadata } from "next";
import { GoToToday } from "@/components/go-to-today";
import { EmptyState, PageHeader } from "@/components/ui/card";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { isDateString, MIN_DATE, toDbDate } from "@/lib/dates";
import { marksOf, RECORD_SELECT, tasksOf, tickTimesOf } from "@/lib/marks";
import { maxTaskDate } from "./limits";
import { TasksSheet } from "./tasks-sheet";

export const metadata: Metadata = { title: "Daily Tasks" };

export default async function TeacherPage({ searchParams }: PageProps<"/teacher">) {
  const teacher = await requireRole("TEACHER");
  const { date } = await searchParams;

  // "Today" depends on the teacher's time zone, so the browser picks it.
  if (!isDateString(date) || date < MIN_DATE || date > maxTaskDate()) {
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

  return (
    <>
      <PageHeader
        title="Daily Tasks"
        description="Set each student's tasks for the day and check what they ticked, and when."
      />
      {students.length === 0 ? (
        <EmptyState text="No students are assigned to you yet. Ask the admin to assign your students." />
      ) : (
        <TasksSheet
          key={date}
          date={date}
          students={students.map((s) => ({
            id: s.id,
            name: s.user.name,
            className: s.className,
            marks: marksOf(s.records[0]),
            times: tickTimesOf(s.records[0]),
            tasks: tasksOf(s.records[0]),
          }))}
        />
      )}
    </>
  );
}
