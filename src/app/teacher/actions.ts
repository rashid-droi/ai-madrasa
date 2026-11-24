"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { isDateString, MIN_DATE, toDbDate } from "@/lib/dates";
import { ACTIVITY_KEYS, taskField, type ActivityKey } from "@/lib/marks";
import { classNameSchema, idSchema } from "@/lib/validation";
import { maxTaskDate } from "./limits";

const taskText = z
  .string()
  .trim()
  .max(300, "Keep each task under 300 characters")
  .transform((v) => (v === "" ? null : v));

const TasksSchema = z
  .object(Object.fromEntries(ACTIVITY_KEYS.map((k) => [k, taskText])) as Record<ActivityKey, typeof taskText>)
  .strict();

const dateSchema = z.string().refine(isDateString, "Invalid date");

const StudentSchema = z.object({ date: dateSchema, studentId: idSchema, tasks: TasksSchema }).strict();
const ClassSchema = z.object({ date: dateSchema, className: classNameSchema, tasks: TasksSchema }).strict();

export type SaveTasksResult = { ok: true; saved: number } | { ok: false; error: string };

type ParsedTasks = z.infer<typeof TasksSchema>;

/** Writes the task columns for each student on one date. Never touches the students' ticks. */
async function writeTasks(teacherId: string, date: string, studentIds: string[], tasks: ParsedTasks) {
  const data = Object.fromEntries(ACTIVITY_KEYS.map((k) => [taskField(k), tasks[k]]));
  const day = toDbDate(date);

  await db.$transaction(
    studentIds.map((studentId) =>
      db.dailyRecord.upsert({
        where: { studentId_date: { studentId, date: day } },
        create: { studentId, date: day, teacherId, ...data },
        update: { teacherId, ...data },
      }),
    ),
  );

  revalidatePath("/teacher", "layout");
  revalidatePath("/student", "layout");
  revalidatePath("/admin", "layout");
}

function dateAllowed(date: string) {
  return date >= MIN_DATE && date <= maxTaskDate();
}

/** Tasks for one of the teacher's own students. */
export async function saveTasks(input: unknown): Promise<SaveTasksResult> {
  const teacher = await requireRole("TEACHER");

  const parsed = StudentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid data" };
  const { date, studentId, tasks } = parsed.data;
  if (!dateAllowed(date)) return { ok: false, error: "You can't set tasks for that date" };

  // The student must currently be assigned to this teacher.
  const owned = await db.student.count({ where: { id: studentId, teacherId: teacher.id } });
  if (!owned) return { ok: false, error: "You can only set tasks for your own students. Refresh and try again." };

  await writeTasks(teacher.id, date, [studentId], tasks);
  return { ok: true, saved: 1 };
}

/** The same tasks for every one of the teacher's students in a class. */
export async function saveClassTasks(input: unknown): Promise<SaveTasksResult> {
  const teacher = await requireRole("TEACHER");

  const parsed = ClassSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid data" };
  const { date, className, tasks } = parsed.data;
  if (!dateAllowed(date)) return { ok: false, error: "You can't set tasks for that date" };

  // Only this teacher's students in that class.
  const students = await db.student.findMany({
    where: { teacherId: teacher.id, className },
    select: { id: true },
  });
  if (students.length === 0) return { ok: false, error: "You have no students in that class." };

  await writeTasks(
    teacher.id,
    date,
    students.map((s) => s.id),
    tasks,
  );
  return { ok: true, saved: students.length };
}
