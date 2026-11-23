import type { Metadata } from "next";
import Link from "next/link";
import { Badge, Card, EmptyState, LinkButton, PageHeader } from "@/components/ui/card";
import { Select } from "@/components/ui/input";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import { getStudentFormOptions } from "./data";

export const metadata: Metadata = { title: "Students" };

const UNASSIGNED = "none";

function param(v: string | string[] | undefined) {
  return typeof v === "string" ? v.slice(0, 50) : "";
}

export default async function StudentsPage({ searchParams }: PageProps<"/admin/students">) {
  await requireRole("ADMIN");
  const sp = await searchParams;
  const classFilter = param(sp.class);
  const teacherFilter = param(sp.teacher);

  const where: Prisma.StudentWhereInput = {
    ...(classFilter ? { className: classFilter } : {}),
    ...(teacherFilter ? { teacherId: teacherFilter === UNASSIGNED ? null : teacherFilter } : {}),
  };

  const [{ teachers, classes }, students] = await Promise.all([
    getStudentFormOptions(),
    db.student.findMany({
      where,
      orderBy: [{ className: "asc" }, { user: { name: "asc" } }],
      select: {
        id: true,
        className: true,
        user: { select: { name: true, username: true } },
        teacher: { select: { name: true } },
      },
    }),
  ]);

  // Group by class for display.
  const groups = new Map<string, typeof students>();
  for (const s of students) {
    const list = groups.get(s.className) ?? [];
    list.push(s);
    groups.set(s.className, list);
  }

  const filtered = Boolean(classFilter || teacherFilter);

  return (
    <>
      <PageHeader
        title="Students"
        description={`${students.length} student${students.length === 1 ? "" : "s"}${filtered ? " (filtered)" : ""}`}
        action={<LinkButton href="/admin/students/new">+ Add student</LinkButton>}
      />

      {/* Plain GET form: works without JavaScript and keeps filters in the URL. */}
      <form method="get" className="mb-6 grid gap-3 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-center">
        <Select name="class" defaultValue={classFilter} aria-label="Filter by class">
          <option value="">All classes</option>
          {classes.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
        <Select name="teacher" defaultValue={teacherFilter} aria-label="Filter by teacher">
          <option value="">All teachers</option>
          <option value={UNASSIGNED}>Unassigned</option>
          {teachers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </Select>
        <button
          type="submit"
          className="min-h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-800 hover:bg-gray-50"
        >
          Apply
        </button>
        {filtered && (
          <Link href="/admin/students" className="min-h-11 content-center px-2 text-center text-sm font-medium text-gray-500 hover:text-gray-900">
            Clear
          </Link>
        )}
      </form>

      {students.length === 0 ? (
        <EmptyState text={filtered ? "No students match these filters." : "No students yet. Add your first student."} />
      ) : (
        <div className="space-y-6">
          {[...groups].map(([className, list]) => (
            <section key={className}>
              <h2 className="mb-2 flex items-center gap-2 px-1 text-sm font-semibold text-gray-700">
                {className}
                <span className="font-normal text-gray-400">{list.length}</span>
              </h2>
              <Card padding="none">
                <ul className="divide-y divide-gray-100">
                  {list.map((s) => (
                    <li key={s.id}>
                      <Link
                        href={`/admin/students/${s.id}`}
                        className="flex min-h-16 items-center justify-between gap-3 px-5 py-3 hover:bg-gray-50"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium text-gray-900">{s.user.name}</p>
                          <p className="truncate text-sm text-gray-500">@{s.user.username}</p>
                        </div>
                        {s.teacher ? (
                          <Badge tone="green">{s.teacher.name}</Badge>
                        ) : (
                          <Badge tone="amber">Unassigned</Badge>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </Card>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
