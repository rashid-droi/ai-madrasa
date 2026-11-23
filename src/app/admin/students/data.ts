import "server-only";
import { db } from "@/lib/db";

/** Options for the student form's teacher and class pickers. */
export async function getStudentFormOptions() {
  const [teachers, classRows] = await Promise.all([
    db.user.findMany({ where: { role: "TEACHER" }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.student.findMany({ distinct: ["className"], orderBy: { className: "asc" }, select: { className: true } }),
  ]);
  return { teachers, classes: classRows.map((r) => r.className) };
}
