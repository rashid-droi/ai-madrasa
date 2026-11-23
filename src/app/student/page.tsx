import type { Metadata } from "next";
import { GoToToday } from "@/components/go-to-today";
import { EmptyState, PageHeader } from "@/components/ui/card";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { addDays, formatDate, isDateString, maxMarkableDate, toDbDate } from "@/lib/dates";
import { marksOf, RECORD_SELECT, tasksOf, tickTimesOf } from "@/lib/marks";
import { StudentDay } from "./student-day";

export const metadata: Metadata = { title: "Today" };

export default async function StudentTodayPage({ searchParams }: PageProps<"/student">) {
  const user = await requireRole("STUDENT");
  // The student id always comes from the signed-in account, never from the URL.
  const studentId = user.studentId;

  if (!studentId) {
    return (
      <>
        <PageHeader title="Today" />
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

  const record = await db.dailyRecord.findUnique({
    where: { studentId_date: { studentId, date: toDbDate(date) } },
    select: RECORD_SELECT,
  });

  return (
    <div className="max-w-3xl">
      <PageHeader title="Today" description={`${formatDate(date)} · tick what you have done`} />
      <StudentDay
        key={date}
        date={date}
        initialMarks={marksOf(record)}
        initialTimes={tickTimesOf(record)}
        tasks={tasksOf(record)}
      />
    </div>
  );
}
