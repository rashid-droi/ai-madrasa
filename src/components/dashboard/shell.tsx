import type { ReactNode } from "react";
import { logout } from "@/app/login/actions";
import { Logo } from "@/components/logo";
import type { CurrentUser } from "@/lib/auth";
import { BottomNav, SidebarNav } from "./nav";
import { NAV } from "./nav-config";

const ROLE_LABEL = { ADMIN: "Admin", TEACHER: "Teacher", STUDENT: "Student" } as const;

function LogoutButton({ compact = false }: { compact?: boolean }) {
  return (
    <form action={logout}>
      <button
        type="submit"
        className={`inline-flex min-h-11 items-center gap-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 ${
          compact ? "px-3" : "w-full px-3"
        }`}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden>
          <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l5-5-5-5M15 12H3" />
        </svg>
        {compact ? <span className="sr-only">Sign out</span> : "Sign out"}
      </button>
    </form>
  );
}

export function DashboardShell({ user, children }: { user: CurrentUser; children: ReactNode }) {
  const withBottomNav = NAV[user.role].length > 1;

  return (
    <div className="min-h-dvh bg-white md:flex">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-gray-200 bg-white px-4 py-5 md:flex">
        <div className="flex items-center gap-3 px-2">
          <Logo />
          <span className="font-semibold text-gray-900">Madrasa Progress</span>
        </div>
        <div className="mt-8 flex-1">
          <SidebarNav role={user.role} />
        </div>
        <div className="border-t border-gray-100 pt-4">
          <div className="px-3 pb-3">
            <p className="truncate text-sm font-medium text-gray-900">{user.name}</p>
            <p className="text-xs text-gray-500">{ROLE_LABEL[user.role]}</p>
          </div>
          <LogoutButton />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-gray-200 bg-white/95 px-4 backdrop-blur md:hidden">
          <div className="flex min-w-0 items-center gap-2.5">
            <Logo />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-gray-900">{user.name}</p>
              <p className="text-xs text-gray-500">{ROLE_LABEL[user.role]}</p>
            </div>
          </div>
          <LogoutButton compact />
        </header>

        <main className={`mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 md:py-8 ${withBottomNav ? "pb-24 md:pb-8" : ""}`}>
          {children}
        </main>
      </div>

      <BottomNav role={user.role} />
    </div>
  );
}
