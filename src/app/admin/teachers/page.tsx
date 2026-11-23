import type { Metadata } from "next";
import Link from "next/link";
import { Badge, Card, EmptyState, LinkButton, PageHeader } from "@/components/ui/card";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Teachers" };

export default async function TeachersPage() {
  await requireRole("ADMIN");

  const teachers = await db.user.findMany({
    where: { role: "TEACHER" },
    orderBy: { name: "asc" },
    select: { id: true, name: true, username: true, _count: { select: { assignedStudents: true } } },
  });

  return (
    <>
      <PageHeader
        title="Teachers"
        description={`${teachers.length} teacher${teachers.length === 1 ? "" : "s"}`}
        action={<LinkButton href="/admin/teachers/new">+ Add teacher</LinkButton>}
      />

      {teachers.length === 0 ? (
        <EmptyState text="No teachers yet. Add your first teacher to start assigning students." />
      ) : (
        <Card className="p-0">
          <ul className="divide-y divide-gray-100">
            {teachers.map((t) => (
              <li key={t.id}>
                <Link
                  href={`/admin/teachers/${t.id}`}
                  className="flex min-h-16 items-center justify-between gap-3 px-5 py-3 hover:bg-gray-50"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-gray-900">{t.name}</p>
                    <p className="truncate text-sm text-gray-500">@{t.username}</p>
                  </div>
                  <Badge tone={t._count.assignedStudents ? "green" : "gray"}>
                    {t._count.assignedStudents} student{t._count.assignedStudents === 1 ? "" : "s"}
                  </Badge>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}
