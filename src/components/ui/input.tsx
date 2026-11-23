import type {
  InputHTMLAttributes,
  LabelHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
} from "react";

export function Label({ className = "", ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={`mb-1.5 block text-sm font-medium text-gray-700 ${className}`} {...props} />;
}

const fieldBase =
  "block min-h-11 w-full rounded-xl border bg-white px-3.5 text-base text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:outline-none sm:text-sm";
const fieldOk = "border-gray-200 focus:border-brand-500 focus:ring-brand-100";
const fieldBad = "border-red-300 focus:border-red-500 focus:ring-red-100";

export function Input({
  className = "",
  invalid = false,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return (
    <input
      aria-invalid={invalid || undefined}
      className={`${fieldBase} ${invalid ? fieldBad : fieldOk} ${className}`}
      {...props}
    />
  );
}

export function Select({
  className = "",
  invalid = false,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }) {
  return (
    <select
      aria-invalid={invalid || undefined}
      className={`${fieldBase} ${invalid ? fieldBad : fieldOk} ${className}`}
      {...props}
    />
  );
}

/** Label + control + hint/error, laid out consistently. */
export function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? (
        <p className="mt-1.5 text-sm text-red-600">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-gray-500">{hint}</p>
      ) : null}
    </div>
  );
}
