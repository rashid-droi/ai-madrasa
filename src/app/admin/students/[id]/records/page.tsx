import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { defaultMonth, isMonthString, RecordHistory } from "@/components/record-history";
import { PageHeader } from "@/components/ui/card";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Student records" };

export default async function StudentRecordsPage({
  params,
  searchParams,
}: PageProps<"/admin/students/[id]/records">) {
  await requireRole("ADMIN");
  const { id } = await params;
  const { month } = await searchParams;

  const student = await db.student.findUnique({
    where: { id },
    select: { id: true, className: true, user: { select: { name: true } }, teacher: { select: { name: true } } },
  });
  if (!student) notFound();

  const shownMonth = isMonthString(month) ? month : await defaultMonth(student.id);

  return (
    <div className="max-w-2xl">
      <PageHeader
        title={student.user.name}
        description={`${student.className} · ${student.teacher?.name ?? "Unassigned"}`}
        back={{ href: `/admin/students/${student.id}`, label: "Student details" }}
      />
      <RecordHistory studentId={student.id} month={shownMonth} basePath={`/admin/students/${student.id}/records`} />
    </div>
  );
}
