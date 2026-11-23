import type { Metadata } from "next";
import { PageHeader, StatCard } from "@/components/ui/card";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Overview" };

export default async function AdminOverview() {
  const user = await requireRole("ADMIN");
  const [teachers, students, unassigned] = await Promise.all([
    db.user.count({ where: { role: "TEACHER" } }),
    db.student.count(),
    db.student.count({ where: { teacherId: null } }),
  ]);

  const stats = [
    { label: "Teachers", value: teachers },
    { label: "Students", value: students },
    { label: "Unassigned students", value: unassigned },
  ];

  return (
    <>
      <PageHeader title={`Assalamu alaikum, ${user.name}`} description="Madrasa at a glance." />
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <StatCard key={s.label} label={s.label} value={s.value} />
        ))}
      </div>
    </>
  );
}
