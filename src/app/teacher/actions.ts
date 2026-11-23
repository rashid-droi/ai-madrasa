"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { isDateString, maxMarkableDate, MIN_DATE, toDbDate } from "@/lib/dates";
import { MARK_KEYS, type MarkKey } from "@/lib/marks";
import { idSchema } from "@/lib/validation";

const MarksSchema = z.object(
  Object.fromEntries(MARK_KEYS.map((k) => [k, z.boolean()])) as Record<MarkKey, z.ZodBoolean>,
).strict();

const SaveSchema = z.object({
  date: z.string().refine(isDateString, "Invalid date"),
  entries: z
    .array(z.object({ studentId: idSchema, marks: MarksSchema }).strict())
    .min(1, "Nothing to save")
    .max(500, "Too many students in one save"),
});

export type SaveResult = { ok: true; saved: number } | { ok: false; error: string };

export async function saveDailyRecords(input: unknown): Promise<SaveResult> {
  const teacher = await requireRole("TEACHER");

  const parsed = SaveSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid data" };

  const { date, entries } = parsed.data;
  if (date < MIN_DATE || date > maxMarkableDate()) {
    return { ok: false, error: "You can't mark progress for that date" };
  }

  const ids = [...new Set(entries.map((e) => e.studentId))];
  if (ids.length !== entries.length) return { ok: false, error: "Duplicate student in request" };

  // Every student must currently be assigned to this teacher.
  const owned = await db.student.count({ where: { id: { in: ids }, teacherId: teacher.id } });
  if (owned !== ids.length) {
    return { ok: false, error: "You can only mark your own students. Refresh and try again." };
  }

  const day = toDbDate(date);
  await db.$transaction(
    entries.map(({ studentId, marks }) =>
      db.dailyRecord.upsert({
        where: { studentId_date: { studentId, date: day } },
        create: { studentId, date: day, teacherId: teacher.id, ...marks },
        update: { teacherId: teacher.id, ...marks },
      }),
    ),
  );

  revalidatePath("/teacher");
  revalidatePath("/admin/records");
  return { ok: true, saved: entries.length };
}
