"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  fieldErrorsOf,
  isUniqueViolation,
  readFields,
  safeValues,
  type FormState,
} from "@/lib/form";
import {
  idSchema,
  nameSchema,
  optionalPasswordSchema,
  passwordSchema,
  usernameSchema,
} from "@/lib/validation";

const FIELDS = ["name", "username", "password"] as const;

const CreateSchema = z.object({ name: nameSchema, username: usernameSchema, password: passwordSchema });
const UpdateSchema = z.object({ name: nameSchema, username: usernameSchema, password: optionalPasswordSchema });

const USERNAME_TAKEN: FormState = { fieldErrors: { username: "This username is already taken" } };

export async function createTeacher(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireRole("ADMIN");

  const raw = readFields(formData, FIELDS);
  const parsed = CreateSchema.safeParse(raw);
  if (!parsed.success) return { fieldErrors: fieldErrorsOf(parsed.error), values: safeValues(raw) };

  const { name, username, password } = parsed.data;
  try {
    await db.user.create({
      data: { name, username, role: "TEACHER", passwordHash: await bcrypt.hash(password, 12) },
    });
  } catch (e) {
    if (isUniqueViolation(e)) return { ...USERNAME_TAKEN, values: safeValues(raw) };
    throw e;
  }

  revalidatePath("/admin", "layout");
  redirect("/admin/teachers");
}

export async function updateTeacher(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireRole("ADMIN");

  const teacherId = idSchema.safeParse(id);
  if (!teacherId.success) return { error: "Teacher not found" };

  const raw = readFields(formData, FIELDS);
  const parsed = UpdateSchema.safeParse(raw);
  if (!parsed.success) return { fieldErrors: fieldErrorsOf(parsed.error), values: safeValues(raw) };

  const { name, username, password } = parsed.data;
  try {
    // `role: "TEACHER"` in the filter guarantees this can never touch an admin or student account.
    const result = await db.user.updateMany({
      where: { id: teacherId.data, role: "TEACHER" },
      data: {
        name,
        username,
        ...(password ? { passwordHash: await bcrypt.hash(password, 12) } : {}),
      },
    });
    if (result.count === 0) return { error: "Teacher not found" };
  } catch (e) {
    if (isUniqueViolation(e)) return { ...USERNAME_TAKEN, values: safeValues(raw) };
    throw e;
  }

  revalidatePath("/admin", "layout");
  redirect("/admin/teachers");
}

export async function deleteTeacher(id: string): Promise<{ error?: string } | undefined> {
  await requireRole("ADMIN");

  const teacherId = idSchema.safeParse(id);
  if (!teacherId.success) return { error: "Teacher not found" };

  // Assigned students become unassigned (onDelete: SetNull); their records are kept.
  const result = await db.user.deleteMany({ where: { id: teacherId.data, role: "TEACHER" } });
  if (result.count === 0) return { error: "Teacher not found" };

  revalidatePath("/admin", "layout");
  redirect("/admin/teachers");
}
