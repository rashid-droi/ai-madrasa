import type { Metadata } from "next";
import { Card, PageHeader } from "@/components/ui/card";
import { requireRole } from "@/lib/auth";
import { createStudent } from "../actions";
import { getStudentFormOptions } from "../data";
import { StudentForm } from "../student-form";

export const metadata: Metadata = { title: "Add student" };

export default async function NewStudentPage() {
  await requireRole("ADMIN");
  const { teachers, classes } = await getStudentFormOptions();

  return (
    <div className="max-w-2xl">
      <PageHeader title="Add student" back={{ href: "/admin/students", label: "Students" }} />
      <Card>
        <StudentForm action={createStudent} teachers={teachers} classes={classes} submitLabel="Create student" />
      </Card>
    </div>
  );
}
