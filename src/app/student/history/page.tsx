import type { Metadata } from "next";
import { defaultMonth, isMonthString, RecordHistory } from "@/components/record-history";
import { EmptyState, PageHeader } from "@/components/ui/card";
import { requireRole } from "@/lib/auth";

export const metadata: Metadata = { title: "History" };

export default async function StudentHistoryPage({ searchParams }: PageProps<"/student/history">) {
  const user = await requireRole("STUDENT");
  // The student id always comes from the signed-in account, never from the URL.
  const studentId = user.studentId;

  if (!studentId) {
    return (
      <>
        <PageHeader title="History" />
        <EmptyState text="Your student profile isn't set up yet. Please contact the madrasa admin." />
      </>
    );
  }

  const { month } = await searchParams;
  const shownMonth = isMonthString(month) ? month : await defaultMonth(studentId);

  return (
    <div className="max-w-2xl">
      <PageHeader title="History" description="Your past days, tasks and tick times." />
      <RecordHistory studentId={studentId} month={shownMonth} basePath="/student/history" />
    </div>
  );
}
