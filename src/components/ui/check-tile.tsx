"use client";

import type { InputHTMLAttributes, ReactNode } from "react";

/**
 * Large, touch-friendly checkbox used for prayer / activity ticks.
 * Native checkbox underneath, so it works with forms and keyboards.
 * `detail` renders under the label (e.g. the teacher's task or tick time).
 */
export function CheckTile({
  label,
  detail,
  className = "",
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & { label: string; detail?: ReactNode }) {
  return (
    <label
      className={`flex min-h-12 cursor-pointer select-none items-center gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50 has-[:checked]:text-brand-700 has-[:disabled]:cursor-wait has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-200 ${className}`}
    >
      <input type="checkbox" className="peer sr-only" {...props} />
      <span
        aria-hidden
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 border-gray-300 bg-white text-white transition-colors peer-checked:border-brand-600 peer-checked:bg-brand-600"
      >
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={3} className="h-4 w-4">
          <path d="m5 10.5 3.5 3.5L15 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block">{label}</span>
        {detail && <span className="mt-0.5 block text-xs font-normal break-words text-gray-500">{detail}</span>}
      </span>
    </label>
  );
}
