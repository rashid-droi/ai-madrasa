export type Role = "ADMIN" | "TEACHER" | "STUDENT";

export const ROLE_HOME: Record<Role, string> = {
  ADMIN: "/admin",
  TEACHER: "/teacher",
  STUDENT: "/student",
};

/** Which role may open which top-level area. */
export function roleForPath(pathname: string): Role | null {
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return "ADMIN";
  if (pathname === "/teacher" || pathname.startsWith("/teacher/")) return "TEACHER";
  if (pathname === "/student" || pathname.startsWith("/student/")) return "STUDENT";
  return null;
}
