import type { Role } from "@/lib/roles";

export type NavIconName = "home" | "users" | "students" | "calendar" | "check";
export type NavItem = { href: string; label: string; icon: NavIconName };

export const NAV: Record<Role, NavItem[]> = {
  ADMIN: [
    { href: "/admin", label: "Overview", icon: "home" },
    { href: "/admin/teachers", label: "Teachers", icon: "users" },
    { href: "/admin/students", label: "Students", icon: "students" },
    { href: "/admin/records", label: "Records", icon: "calendar" },
  ],
  TEACHER: [{ href: "/teacher", label: "Daily Marking", icon: "check" }],
  STUDENT: [{ href: "/student", label: "My Progress", icon: "calendar" }],
};
