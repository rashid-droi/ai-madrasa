import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Card, PageHeader } from "@/components/ui/card";
import { DeleteForm } from "@/components/ui/delete-form";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { deleteTeacher, updateTeacher } from "../actions";
import { TeacherForm } from "../teacher-form";

export const metadata: Metadata = { title: "Edit teacher" };

export default async function EditTeacherPage({ params }: PageProps<"/admin/teachers/[id]">) {
  await requireRole("ADMIN");
  const { id } = await params;

  const teacher = await db.user.findFirst({
    where: { id, role: "TEACHER" },
    select: {
      id: true,
      name: true,
      username: true,
      assignedStudents: {
        orderBy: [{ className: "asc" }, { user: { name: "asc" } }],
        select: { id: true, className: true, user: { select: { name: true } } },
      },
    },
  });
  if (!teacher) notFound();

  const students = teacher.assignedStudents;

  return (
    <div className="max-w-xl space-y-6">
      <PageHeader title={teacher.name} description={`@${teacher.username}`} back={{ href: "/admin/teachers", label: "Teachers" }} />

      <Card>
        <h2 className="mb-4 font-semibold text-gray-900">Details</h2>
        <TeacherForm
          action={updateTeacher.bind(null, teacher.id)}
          initial={{ name: teacher.name, username: teacher.username }}
          submitLabel="Save changes"
        />
      </Card>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Assigned students</h2>
          <Badge tone={students.length ? "green" : "gray"}>{students.length}</Badge>
        </div>
        {students.length === 0 ? (
          <p className="text-sm text-gray-500">
            No students assigned. Assign students from the{" "}
            <Link href="/admin/students" className="font-medium text-brand-700 hover:underline">
              Students
            </Link>{" "}
            page.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {students.map((s) => (
              <li key={s.id}>
                <Link href={`/admin/students/${s.id}`} className="flex min-h-11 items-center justify-between gap-3 py-2 hover:text-brand-700">
                  <span className="truncate text-sm font-medium">{s.user.name}</span>
                  <span className="shrink-0 text-xs text-gray-500">{s.className}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="border-red-100">
        <h2 className="font-semibold text-gray-900">Delete teacher</h2>
        <p className="mt-1 mb-4 text-sm text-gray-500">
          Their students become unassigned. Daily records already saved are kept.
        </p>
        <DeleteForm
          action={deleteTeacher.bind(null, teacher.id)}
          label="Delete teacher"
          confirmText={`Delete ${teacher.name}? This cannot be undone.`}
        />
      </Card>
    </div>
  );
}
