import type { Metadata } from "next";
import { Card, PageHeader } from "@/components/ui/card";
import { requireRole } from "@/lib/auth";
import { createTeacher } from "../actions";
import { TeacherForm } from "../teacher-form";

export const metadata: Metadata = { title: "Add teacher" };

export default async function NewTeacherPage() {
  await requireRole("ADMIN");
  return (
    <div className="max-w-xl">
      <PageHeader title="Add teacher" back={{ href: "/admin/teachers", label: "Teachers" }} />
      <Card>
        <TeacherForm action={createTeacher} submitLabel="Create teacher" />
      </Card>
    </div>
  );
}
