import { DashboardShell } from "@/components/dashboard/shell";
import { requireRole } from "@/lib/auth";

export default async function Layout({ children }: LayoutProps<"/student">) {
  const user = await requireRole("STUDENT");
  return <DashboardShell user={user}>{children}</DashboardShell>;
}
