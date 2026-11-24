import { TickTime } from "@/components/tick-time";
import { ACTIVITIES, PRAYERS, type Marks, type Tasks, type TickTimes } from "@/lib/marks";

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

/**
 * Read-only view of a day: what was ticked, when, and the teacher's tasks.
 * Used by the teacher, admin and student history pages.
 */
export function MarksView({
  date,
  marks,
  times,
  tasks,
  showPrayers = true,
}: {
  date: string;
  marks: Marks;
  times: TickTimes;
  tasks: Tasks;
  showPrayers?: boolean;
}) {
  return (
    <div className="space-y-3">
      {showPrayers && (
        <div>
          <p className="mb-1.5 text-xs font-medium text-gray-500">Prayers</p>
          <ul className="grid grid-cols-5 gap-1.5">
            {PRAYERS.map((p) => (
              <li
                key={p.key}
                className={`flex flex-col items-center rounded-lg px-1 py-1.5 text-center ${
                  marks[p.key] ? "bg-brand-50 text-brand-700" : "bg-gray-50 text-gray-400"
                }`}
              >
                <span className="text-xs font-medium">
                  <span aria-hidden>{marks[p.key] ? "✓ " : ""}</span>
                  {p.label}
                  <span className="sr-only">{marks[p.key] ? " done" : " not done"}</span>
                </span>
                {marks[p.key] && times[p.key] ? (
                  <TickTime iso={times[p.key]!} recordDate={date} />
                ) : (
                  <span className="text-xs">–</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <p className="mb-1.5 text-xs font-medium text-gray-500">Activities</p>
        <ul className="divide-y divide-gray-100 rounded-xl border border-gray-100">
          {ACTIVITIES.map((a) => (
            <li key={a.key} className="flex items-start justify-between gap-3 px-3 py-2">
              <div className="min-w-0">
                <p className={`text-sm font-medium ${marks[a.key] ? "text-brand-700" : "text-gray-500"}`}>
                  <span aria-hidden>{marks[a.key] ? "✓ " : "– "}</span>
                  {a.label}
                  <span className="sr-only">{marks[a.key] ? " done" : " not done"}</span>
                </p>
                {tasks[a.key] && <p className="mt-0.5 text-xs break-words text-gray-500">{tasks[a.key]}</p>}
              </div>
              {marks[a.key] && times[a.key] && (
                <span className="shrink-0 pt-0.5">
                  <TickTime iso={times[a.key]!} recordDate={date} />
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
