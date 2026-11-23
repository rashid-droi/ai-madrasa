import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, PageHeader } from "@/components/ui/card";
import { DeleteForm } from "@/components/ui/delete-form";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { deleteStudent, updateStudent } from "../actions";
import { getStudentFormOptions } from "../data";
import { StudentForm } from "../student-form";

export const metadata: Metadata = { title: "Edit student" };

export default async function EditStudentPage({ params }: PageProps<"/admin/students/[id]">) {
  await requireRole("ADMIN");
  const { id } = await params;

  const [student, { teachers, classes }] = await Promise.all([
    db.student.findUnique({
      where: { id },
      select: {
        id: true,
        className: true,
        teacherId: true,
        user: { select: { name: true, username: true } },
      },
    }),
    getStudentFormOptions(),
  ]);
  if (!student) notFound();

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader
        title={student.user.name}
        description={`${student.className} · @${student.user.username}`}
        back={{ href: "/admin/students", label: "Students" }}
        action={
          <Link
            href={`/admin/students/${student.id}/records`}
            className="inline-flex min-h-11 items-center rounded-xl border border-gray-200 px-4 text-sm font-medium text-gray-800 hover:bg-gray-50"
          >
            View records
          </Link>
        }
      />

      <Card>
        <StudentForm
          action={updateStudent.bind(null, student.id)}
          teachers={teachers}
          classes={classes}
          initial={{
            name: student.user.name,
            username: student.user.username,
            className: student.className,
            teacherId: student.teacherId ?? "",
          }}
          submitLabel="Save changes"
        />
      </Card>

      <Card className="border-red-100">
        <h2 className="font-semibold text-gray-900">Delete student</h2>
        <p className="mt-1 mb-4 text-sm text-gray-500">
          Removes the student&apos;s account and all of their daily records.
        </p>
        <DeleteForm
          action={deleteStudent.bind(null, student.id)}
          label="Delete student"
          confirmText={`Delete ${student.user.name} and all their records? This cannot be undone.`}
        />
      </Card>
    </div>
  );
}
