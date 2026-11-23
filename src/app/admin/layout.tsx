import { DashboardShell } from "@/components/dashboard/shell";
import { requireRole } from "@/lib/auth";

export default async function Layout({ children }: LayoutProps<"/admin">) {
  const user = await requireRole("ADMIN");
  return <DashboardShell user={user}>{children}</DashboardShell>;
}
