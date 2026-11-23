import Link from "next/link";
import type { HTMLAttributes, ReactNode } from "react";

const PADDING = { none: "", sm: "p-3", md: "p-4", lg: "p-5" } as const;

export function Card({
  className = "",
  padding = "lg",
  ...props
}: HTMLAttributes<HTMLDivElement> & { padding?: keyof typeof PADDING }) {
  return (
    <div
      className={`rounded-2xl border border-gray-200 bg-white shadow-sm ${PADDING[padding]} ${className}`}
      {...props}
    />
  );
}

export function PageHeader({
  title,
  description,
  action,
  back,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <div className="mb-6">
      {back && (
        <Link
          href={back.href}
          className="mb-3 inline-flex min-h-9 items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-900"
        >
          <span aria-hidden>←</span> {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl">{title}</h1>
          {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
        </div>
        {action}
      </div>
    </div>
  );
}

/** Primary-styled link (for "Add …" buttons). */
export function LinkButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-700"
    >
      {children}
    </Link>
  );
}

export function Badge({ tone = "gray", children }: { tone?: "gray" | "green" | "amber"; children: ReactNode }) {
  const tones = {
    gray: "bg-gray-100 text-gray-700",
    green: "bg-brand-50 text-brand-700",
    amber: "bg-amber-50 text-amber-700",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function EmptyState({ text, action }: { text: string; action?: ReactNode }) {
  return (
    <Card className="border-dashed text-center">
      <p className="py-6 text-sm text-gray-500">{text}</p>
      {action}
    </Card>
  );
}

/** Summary number card used on the overview pages. */
export function StatCard({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <Card>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-3xl font-semibold text-gray-900 tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </Card>
  );
}
