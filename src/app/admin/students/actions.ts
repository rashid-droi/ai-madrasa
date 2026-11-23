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
  classNameSchema,
  idSchema,
  nameSchema,
  optionalIdSchema,
  optionalPasswordSchema,
  passwordSchema,
  usernameSchema,
} from "@/lib/validation";

const FIELDS = ["name", "username", "password", "className", "teacherId"] as const;

const base = {
  name: nameSchema,
  username: usernameSchema,
  className: classNameSchema,
  teacherId: optionalIdSchema,
};
const CreateSchema = z.object({ ...base, password: passwordSchema });
const UpdateSchema = z.object({ ...base, password: optionalPasswordSchema });

const USERNAME_TAKEN = { username: "This username is already taken" };

/** The chosen teacher must exist and actually be a teacher. */
async function teacherExists(teacherId: string | null) {
  if (!teacherId) return true;
  const count = await db.user.count({ where: { id: teacherId, role: "TEACHER" } });
  return count > 0;
}

export async function createStudent(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireRole("ADMIN");

  const raw = readFields(formData, FIELDS);
  const parsed = CreateSchema.safeParse(raw);
  if (!parsed.success) return { fieldErrors: fieldErrorsOf(parsed.error), values: safeValues(raw) };

  const { name, username, password, className, teacherId } = parsed.data;
  if (!(await teacherExists(teacherId))) {
    return { fieldErrors: { teacherId: "Choose a valid teacher" }, values: safeValues(raw) };
  }

  try {
    await db.user.create({
      data: {
        name,
        username,
        role: "STUDENT",
        passwordHash: await bcrypt.hash(password, 12),
        studentProfile: { create: { className, teacherId } },
      },
    });
  } catch (e) {
    if (isUniqueViolation(e)) return { fieldErrors: USERNAME_TAKEN, values: safeValues(raw) };
    throw e;
  }

  revalidatePath("/admin", "layout");
  redirect("/admin/students");
}

export async function updateStudent(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireRole("ADMIN");

  const studentId = idSchema.safeParse(id);
  if (!studentId.success) return { error: "Student not found" };

  const raw = readFields(formData, FIELDS);
  const parsed = UpdateSchema.safeParse(raw);
  if (!parsed.success) return { fieldErrors: fieldErrorsOf(parsed.error), values: safeValues(raw) };

  const { name, username, password, className, teacherId } = parsed.data;
  if (!(await teacherExists(teacherId))) {
    return { fieldErrors: { teacherId: "Choose a valid teacher" }, values: safeValues(raw) };
  }

  const student = await db.student.findUnique({
    where: { id: studentId.data },
    select: { userId: true },
  });
  if (!student) return { error: "Student not found" };

  const passwordHash = password ? await bcrypt.hash(password, 12) : undefined;
  try {
    await db.$transaction([
      db.user.update({
        where: { id: student.userId, role: "STUDENT" },
        data: { name, username, ...(passwordHash ? { passwordHash } : {}) },
      }),
      db.student.update({ where: { id: studentId.data }, data: { className, teacherId } }),
    ]);
  } catch (e) {
    if (isUniqueViolation(e)) return { fieldErrors: USERNAME_TAKEN, values: safeValues(raw) };
    throw e;
  }

  revalidatePath("/admin", "layout");
  redirect("/admin/students");
}

export async function deleteStudent(id: string): Promise<{ error?: string } | undefined> {
  await requireRole("ADMIN");

  const studentId = idSchema.safeParse(id);
  if (!studentId.success) return { error: "Student not found" };

  const student = await db.student.findUnique({
    where: { id: studentId.data },
    select: { userId: true },
  });
  if (!student) return { error: "Student not found" };

  // Deleting the account cascades to the student profile and its daily records.
  await db.user.deleteMany({ where: { id: student.userId, role: "STUDENT" } });

  revalidatePath("/admin", "layout");
  redirect("/admin/students");
}
