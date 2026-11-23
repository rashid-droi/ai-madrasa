"use client";

import { useState, useTransition } from "react";
import { ProgressBar } from "@/components/progress";
import { TickTime } from "@/components/tick-time";
import { CheckTile } from "@/components/ui/check-tile";
import {
  ACTIVITIES,
  countDone,
  PRAYERS,
  TOTAL_MARKS,
  type MarkKey,
  type Marks,
  type Tasks,
  type TickTimes,
} from "@/lib/marks";
import { setTick } from "./actions";

/** The student's own ticking screen for one day. Each tick saves immediately. */
export function StudentDay({
  date,
  initialMarks,
  initialTimes,
  tasks,
}: {
  date: string;
  initialMarks: Marks;
  initialTimes: TickTimes;
  tasks: Tasks;
}) {
  const [marks, setMarks] = useState(initialMarks);
  const [times, setTimes] = useState(initialTimes);
  const [saving, setSaving] = useState<Set<MarkKey>>(() => new Set());
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function toggle(key: MarkKey, value: boolean) {
    const prev = { mark: marks[key], time: times[key] };
    setMarks((m) => ({ ...m, [key]: value }));
    setTimes((t) => ({ ...t, [key]: value ? new Date().toISOString() : null }));
    setSaving((s) => new Set(s).add(key));
    setError(null);

    startTransition(async () => {
      const result = await setTick({ date, key, value });
      if (result.ok) {
        setTimes((t) => ({ ...t, [key]: result.at }));
      } else {
        setMarks((m) => ({ ...m, [key]: prev.mark }));
        setTimes((t) => ({ ...t, [key]: prev.time }));
        setError(result.error);
      }
      setSaving((s) => {
        const next = new Set(s);
        next.delete(key);
        return next;
      });
    });
  }

  const done = countDone(marks);
  const tickedAt = (key: MarkKey) =>
    marks[key] && times[key] ? (
      <>
        Ticked <TickTime iso={times[key]!} recordDate={date} />
      </>
    ) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ProgressBar value={done} max={TOTAL_MARKS} className="flex-1" />
        <span className="text-sm font-semibold text-gray-700 tabular-nums">
          {done}/{TOTAL_MARKS}
        </span>
      </div>

      {error && (
        <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <section>
        <h2 className="mb-2 text-sm font-semibold text-gray-700">
          Prayers <span className="font-normal text-gray-400">{countDone(marks, PRAYERS.map((p) => p.key))}/5</span>
        </h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {PRAYERS.map((p) => (
            <CheckTile
              key={p.key}
              label={p.label}
              checked={marks[p.key]}
              disabled={saving.has(p.key)}
              onChange={(e) => toggle(p.key, e.target.checked)}
              detail={tickedAt(p.key)}
            />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-gray-700">
          Today&apos;s activities{" "}
          <span className="font-normal text-gray-400">
            {countDone(marks, ACTIVITIES.map((a) => a.key))}/{ACTIVITIES.length}
          </span>
        </h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {ACTIVITIES.map((a) => (
            <CheckTile
              key={a.key}
              label={a.label}
              checked={marks[a.key]}
              disabled={saving.has(a.key)}
              onChange={(e) => toggle(a.key, e.target.checked)}
              detail={
                tasks[a.key] || tickedAt(a.key) ? (
                  <>
                    {tasks[a.key] && <span className="block text-gray-700">Task: {tasks[a.key]}</span>}
                    {tickedAt(a.key) && <span className="block">{tickedAt(a.key)}</span>}
                  </>
                ) : null
              }
            />
          ))}
        </div>
      </section>

      <p className="text-xs text-gray-400">Each tick is saved right away with the time, and your teacher can see it.</p>
    </div>
  );
}
