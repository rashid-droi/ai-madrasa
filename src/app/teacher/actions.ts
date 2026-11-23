"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { isDateString, MIN_DATE, toDbDate } from "@/lib/dates";
import { ACTIVITY_KEYS, taskField, type ActivityKey } from "@/lib/marks";
import { maxTaskDate } from "./limits";
import { idSchema } from "@/lib/validation";

const taskText = z
  .string()
  .trim()
  .max(300, "Keep each task under 300 characters")
  .transform((v) => (v === "" ? null : v));

const SaveSchema = z
  .object({
    date: z.string().refine(isDateString, "Invalid date"),
    studentId: idSchema,
    tasks: z
      .object(Object.fromEntries(ACTIVITY_KEYS.map((k) => [k, taskText])) as Record<ActivityKey, typeof taskText>)
      .strict(),
  })
  .strict();

export type SaveTasksResult = { ok: true } | { ok: false; error: string };

/** Teacher writes the day's tasks for one of their students. Never touches the student's ticks. */
export async function saveTasks(input: unknown): Promise<SaveTasksResult> {
  const teacher = await requireRole("TEACHER");

  const parsed = SaveSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid data" };
  const { date, studentId, tasks } = parsed.data;

  if (date < MIN_DATE || date > maxTaskDate()) {
    return { ok: false, error: "You can't set tasks for that date" };
  }

  // The student must currently be assigned to this teacher.
  const owned = await db.student.count({ where: { id: studentId, teacherId: teacher.id } });
  if (!owned) return { ok: false, error: "You can only set tasks for your own students. Refresh and try again." };

  const data = Object.fromEntries(ACTIVITY_KEYS.map((k) => [taskField(k), tasks[k]]));
  const day = toDbDate(date);

  await db.dailyRecord.upsert({
    where: { studentId_date: { studentId, date: day } },
    create: { studentId, date: day, teacherId: teacher.id, ...data },
    update: { teacherId: teacher.id, ...data },
  });

  revalidatePath("/teacher", "layout");
  revalidatePath("/student", "layout");
  revalidatePath("/admin", "layout");
  return { ok: true };
}
