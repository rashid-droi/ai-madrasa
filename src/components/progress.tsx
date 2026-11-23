import { LEARNING, PRAYERS, type Marks } from "@/lib/marks";

/** Thin green progress bar. */
export function ProgressBar({ value, max, className = "" }: { value: number; max: number; className?: string }) {
  const pct = max ? Math.round((value / max) * 100) : 0;
  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      className={`h-2 overflow-hidden rounded-full bg-gray-100 ${className}`}
    >
      <div className="h-full rounded-full bg-brand-500 transition-[width]" style={{ width: `${pct}%` }} />
    </div>
  );
}

/** Read-only view of the ten marks, used by admin and student pages. */
export function MarksView({ marks }: { marks: Marks }) {
  return (
    <div className="space-y-2">
      <MarkRow title="Prayers" items={PRAYERS} marks={marks} />
      <MarkRow title="Learning" items={LEARNING} marks={marks} />
    </div>
  );
}

function MarkRow({
  title,
  items,
  marks,
}: {
  title: string;
  items: readonly { key: keyof Marks; label: string }[];
  marks: Marks;
}) {
  return (
    <div>
      <p className="mb-1 text-xs font-medium text-gray-500">{title}</p>
      <ul className="flex flex-wrap gap-1.5">
        {items.map((i) => (
          <li
            key={i.key}
            className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium ${
              marks[i.key] ? "bg-brand-50 text-brand-700" : "bg-gray-50 text-gray-400"
            }`}
          >
            <span aria-hidden>{marks[i.key] ? "✓" : "–"}</span>
            {i.label}
            <span className="sr-only">{marks[i.key] ? "done" : "not done"}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
