"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { createSession, deleteSession } from "@/lib/session";
import { ROLE_HOME } from "@/lib/roles";

const LoginSchema = z.object({
  username: z.string().trim().toLowerCase().min(1, "Enter your username").max(50),
  password: z.string().min(1, "Enter your password").max(200),
});

export type LoginState = { error?: string; username?: string } | undefined;

// Compared against when the username does not exist, so a wrong username
// and a wrong password take about the same time.
const DUMMY_HASH = "$2b$12$kt1g7UUISvZX0us2bn/DvOlRy1SlNPRNKPKHZPwsZqK3Q8T5MbIae";

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = LoginSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
  });
  const typedUsername = String(formData.get("username") ?? "").slice(0, 50);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input", username: typedUsername };
  }

  const { username, password } = parsed.data;
  const user = await db.user.findUnique({
    where: { username },
    select: { id: true, role: true, passwordHash: true },
  });

  const valid = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !valid) {
    return { error: "Incorrect username or password", username: typedUsername };
  }

  await createSession({ userId: user.id, role: user.role });
  redirect(ROLE_HOME[user.role]);
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}
