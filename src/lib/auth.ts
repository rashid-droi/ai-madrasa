// Data Access Layer for authentication.
// Every page, server action and route handler must go through these helpers:
// they re-check the session AND the database on every request, so a deleted
// user or a changed role takes effect immediately.
import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { db } from "./db";
import { readSession } from "./session";
import { ROLE_HOME, type Role } from "./roles";

export type CurrentUser = {
  id: string;
  name: string;
  username: string;
  role: Role;
  /** Student profile id, only for STUDENT users. */
  studentId: string | null;
};

/** The signed-in user, or null. Never includes the password hash. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await readSession();
  if (!session) return null;

  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      name: true,
      username: true,
      role: true,
      studentProfile: { select: { id: true } },
    },
  });
  if (!user) return null;

  return {
    id: user.id,
    name: user.name,
    username: user.username,
    role: user.role,
    studentId: user.studentProfile?.id ?? null,
  };
});

/**
 * Use at the top of every protected page and server action.
 * Redirects to /login when signed out, or to the user's own area
 * when they have the wrong role.
 */
export async function requireRole(role: Role): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== role) redirect(ROLE_HOME[user.role]);
  return user;
}
