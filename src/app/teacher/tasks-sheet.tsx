"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore, useTransition } from "react";
import { MarksView, ProgressBar } from "@/components/progress";
import { TickTime } from "@/components/tick-time";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { addDays, formatDate, localToday } from "@/lib/dates";
import {
  ACTIVITIES,
  ACTIVITY_KEYS,
  countDone,
  PRAYERS,
  TOTAL_MARKS,
  type Marks,
  type Tasks,
  type TickTimes,
} from "@/lib/marks";
import { saveTasks } from "./actions";

type StudentRow = {
  id: string;
  name: string;
  className: string;
  marks: Marks;
  times: TickTimes;
  tasks: Tasks;
};

type Draft = Record<keyof Tasks, string>;

const noopSubscribe = () => () => {};
const toDraft = (t: Tasks): Draft =>
  Object.fromEntries(ACTIVITY_KEYS.map((k) => [k, t[k] ?? ""])) as Draft;
const sameDraft = (a: Draft, b: Draft) => ACTIVITY_KEYS.every((k) => a[k].trim() === b[k].trim());
const hasTasks = (d: Draft) => ACTIVITY_KEYS.some((k) => d[k].trim() !== "");

export function TasksSheet({ date, students }: { date: string; students: StudentRow[] }) {
  const router = useRouter();
  const [saved, setSaved] = useState<Record<string, Draft>>(() =>
    Object.fromEntries(students.map((s) => [s.id, toDraft(s.tasks)])),
  );
  const [drafts, setDrafts] = useState<Record<string, Draft>>(saved);
  const [open, setOpen] = useState<Set<string>>(() =>
    students.length === 1 ? new Set([students[0].id]) : new Set(),
  );
  const [messages, setMessages] = useState<Record<string, { tone: "ok" | "error"; text: string }>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const dirtyIds = students.filter((s) => !sameDraft(drafts[s.id], saved[s.id])).map((s) => s.id);
  const dirty = dirtyIds.length > 0;

  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const today = useSyncExternalStore(noopSubscribe, localToday, () => null);

  function goTo(next: string) {
    if (dirty && !window.confirm("You have unsaved tasks. Leave this date without saving?")) return;
    router.push(`/teacher/tasks?date=${next}`);
  }

  function toggleOpen(id: string) {
    setOpen((o) => {
      const next = new Set(o);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function save(id: string) {
    const draft = drafts[id];
    setSavingId(id);
    startTransition(async () => {
      const result = await saveTasks({ date, studentId: id, tasks: draft });
      if (result.ok) {
        const clean = Object.fromEntries(ACTIVITY_KEYS.map((k) => [k, draft[k].trim()])) as Draft;
        setSaved((s) => ({ ...s, [id]: clean }));
        setDrafts((d) => ({ ...d, [id]: clean }));
        setMessages((m) => ({ ...m, [id]: { tone: "ok", text: "Tasks saved" } }));
      } else {
        setMessages((m) => ({ ...m, [id]: { tone: "error", text: result.error } }));
      }
      setSavingId(null);
    });
  }

  const ticked = students.filter((s) => countDone(s.marks) > 0).length;
  const allOpen = open.size === students.length;

  return (
    <div>
      {/* Date bar */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Button variant="secondary" aria-label="Previous day" onClick={() => goTo(addDays(date, -1))} className="w-11 px-0">
          ‹
        </Button>
        <input
          type="date"
          value={date}
          aria-label="Date"
          onChange={(e) => e.target.value && goTo(e.target.value)}
          className="min-h-11 rounded-xl border border-gray-200 bg-white px-3 text-base text-gray-900 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 focus:outline-none sm:text-sm"
        />
        <Button variant="secondary" aria-label="Next day" onClick={() => goTo(addDays(date, 1))} className="w-11 px-0">
          ›
        </Button>
        {today && date !== today && (
          <Button variant="ghost" onClick={() => goTo(today)}>
            Today
          </Button>
        )}
      </div>

      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-gray-600">
          <span className="font-medium text-gray-900">{formatDate(date)}</span> · {ticked}/{students.length} students
          ticked something
        </p>
        <button
          type="button"
          onClick={() => setOpen(allOpen ? new Set() : new Set(students.map((s) => s.id)))}
          className="min-h-9 rounded-lg px-2 text-sm font-medium text-brand-700 hover:bg-brand-50"
        >
          {allOpen ? "Collapse all" : "Expand all"}
        </button>
      </div>

      <ul className="space-y-3">
        {students.map((s) => {
          const done = countDone(s.marks);
          const isOpen = open.has(s.id);
          const isDirty = dirtyIds.includes(s.id);
          const draft = drafts[s.id];
          const msg = messages[s.id];

          return (
            <li key={s.id} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <button
                type="button"
                onClick={() => toggleOpen(s.id)}
                aria-expanded={isOpen}
                aria-controls={`student-${s.id}`}
                className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-gray-50"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-medium text-gray-900">{s.name}</p>
                    {isDirty ? (
                      <Pill tone="amber">Unsaved</Pill>
                    ) : hasTasks(saved[s.id]) ? (
                      <Pill tone="green">Tasks set</Pill>
                    ) : (
                      <Pill tone="gray">No tasks</Pill>
                    )}
                  </div>
                  <div className="mt-2 flex items-center gap-3">
                    <ProgressBar value={done} max={TOTAL_MARKS} className="flex-1" />
                    <span className="w-16 shrink-0 text-right text-xs font-medium text-gray-600 tabular-nums">
                      {done}/{TOTAL_MARKS} ticked
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">{s.className}</p>
                </div>
                <span className="inline-flex min-h-9 shrink-0 items-center gap-1 rounded-lg border border-gray-200 px-2.5 text-sm font-medium text-brand-700">
                  {isOpen ? "Close" : "Set tasks"}
                <svg
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden
                  className={`h-4 w-4 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
                >
                  <path d="M5.2 7.2a.75.75 0 0 1 1.06 0L10 10.94l3.74-3.74a.75.75 0 1 1 1.06 1.06l-4.27 4.27a.75.75 0 0 1-1.06 0L5.2 8.26a.75.75 0 0 1 0-1.06Z" />
                </svg>
                </span>
              </button>

              {/* Prayer tick times, always visible */}
              <ul aria-label={`${s.name} prayer ticks`} className="grid grid-cols-5 gap-1.5 px-4 pb-3">
                {PRAYERS.map((p) => {
                  const on = s.marks[p.key];
                  const at = s.times[p.key];
                  return (
                    <li
                      key={p.key}
                      className={`flex flex-col items-center rounded-lg px-1 py-1.5 text-center ${
                        on ? "bg-brand-50 text-brand-700" : "bg-gray-50 text-gray-400"
                      }`}
                    >
                      <span className="text-xs font-medium">
                        <span aria-hidden>{on ? "✓ " : ""}</span>
                        {p.label}
                        <span className="sr-only">{on ? " ticked" : " not ticked"}</span>
                      </span>
                      {on && at ? <TickTime iso={at} recordDate={date} /> : <span className="text-xs">{on ? "no time" : "–"}</span>}
                    </li>
                  );
                })}
              </ul>

              {isOpen && (
                <div id={`student-${s.id}`} className="space-y-5 border-t border-gray-100 px-4 py-4">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      save(s.id);
                    }}
                    className="space-y-3"
                  >
                    <h3 className="text-sm font-semibold text-gray-700">Tasks for this day</h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {ACTIVITIES.map((a) => (
                        <Field key={a.key} label={a.taskLabel} htmlFor={`${s.id}-${a.key}`}>
                          <Input
                            id={`${s.id}-${a.key}`}
                            value={draft[a.key]}
                            placeholder={a.placeholder}
                            maxLength={300}
                            onChange={(e) => {
                              const value = e.target.value;
                              setDrafts((d) => ({ ...d, [s.id]: { ...d[s.id], [a.key]: value } }));
                              setMessages((m) => {
                                const next = { ...m };
                                delete next[s.id];
                                return next;
                              });
                            }}
                          />
                        </Field>
                      ))}
                    </div>
                    <div className="flex items-center justify-end gap-3">
                      {msg && (
                        <p role="status" className={`text-sm ${msg.tone === "error" ? "text-red-600" : "text-brand-700"}`}>
                          {msg.text}
                        </p>
                      )}
                      <Button type="submit" disabled={!isDirty || savingId === s.id}>
                        {savingId === s.id ? "Saving…" : "Save tasks"}
                      </Button>
                    </div>
                  </form>

                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-gray-700">
                      Activities ticked <span className="font-normal text-gray-400">with the time they ticked</span>
                    </h3>
                    <MarksView date={date} marks={s.marks} times={s.times} tasks={s.tasks} showPrayers={false} />
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Pill({ tone, children }: { tone: "green" | "amber" | "gray"; children: React.ReactNode }) {
  const styles = {
    green: "bg-brand-50 text-brand-700",
    amber: "bg-amber-50 text-amber-700",
    gray: "bg-gray-100 text-gray-500",
  };
  return <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${styles[tone]}`}>{children}</span>;
}
