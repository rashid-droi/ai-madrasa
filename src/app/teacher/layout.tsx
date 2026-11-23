import { DashboardShell } from "@/components/dashboard/shell";
import { requireRole } from "@/lib/auth";

export default async function Layout({ children }: LayoutProps<"/teacher">) {
  const user = await requireRole("TEACHER");
  return <DashboardShell user={user}>{children}</DashboardShell>;
}
