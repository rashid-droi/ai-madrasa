"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { addDays, isDateString, maxMarkableDate, toDbDate } from "@/lib/dates";
import { atField, MARK_KEYS, type MarkKey } from "@/lib/marks";

const TickSchema = z
  .object({
    date: z.string().refine(isDateString, "Invalid date"),
    key: z.enum(MARK_KEYS as [MarkKey, ...MarkKey[]]),
    value: z.boolean(),
  })
  .strict();

export type TickResult = { ok: true; at: string | null } | { ok: false; error: string };

/** Earliest date a student may tick: yesterday in the earliest time zone. */
function minTickableDate() {
  return addDays(new Date().toISOString().slice(0, 10), -1);
}

export async function setTick(input: unknown): Promise<TickResult> {
  const user = await requireRole("STUDENT");
  // The student is always the signed-in account; nothing in the request can change that.
  if (!user.studentId) return { ok: false, error: "Your student profile isn't set up yet." };

  const parsed = TickSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid request" };
  const { date, key, value } = parsed.data;

  if (date < minTickableDate() || date > maxMarkableDate()) {
    return { ok: false, error: "You can only tick today's activities." };
  }

  const student = await db.student.findUnique({
    where: { id: user.studentId },
    select: { id: true, teacherId: true },
  });
  if (!student) return { ok: false, error: "Your student profile isn't set up yet." };

  const at = value ? new Date() : null;
  const data = { [key]: value, [atField(key)]: at };

  await db.dailyRecord.upsert({
    where: { studentId_date: { studentId: student.id, date: toDbDate(date) } },
    create: { studentId: student.id, teacherId: student.teacherId, date: toDbDate(date), ...data },
    update: data,
  });

  revalidatePath("/student", "layout");
  return { ok: true, at: at?.toISOString() ?? null };
}
