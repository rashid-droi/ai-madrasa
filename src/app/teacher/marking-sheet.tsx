"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useSyncExternalStore, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { CheckTile } from "@/components/ui/check-tile";
import { ProgressBar } from "@/components/progress";
import { addDays, formatDate, localToday } from "@/lib/dates";
import {
  countDone,
  emptyMarks,
  LEARNING,
  MARK_KEYS,
  PRAYERS,
  TOTAL_MARKS,
  type MarkKey,
  type Marks,
} from "@/lib/marks";
import { saveDailyRecords } from "./actions";

type StudentRow = { id: string; name: string; className: string; saved: Marks | null };

const noopSubscribe = () => () => {};

const sameMarks = (a: Marks, b: Marks) => MARK_KEYS.every((k) => a[k] === b[k]);

export function MarkingSheet({ date, students }: { date: string; students: StudentRow[] }) {
  const router = useRouter();
  const [saved, setSaved] = useState<Record<string, Marks | null>>(() =>
    Object.fromEntries(students.map((s) => [s.id, s.saved])),
  );
  const [marks, setMarks] = useState<Record<string, Marks>>(() =>
    Object.fromEntries(students.map((s) => [s.id, s.saved ?? emptyMarks()])),
  );
  // Students without a record become "dirty" once touched, even if left all unticked,
  // so a teacher can save an explicit "nothing done" day.
  const [touched, setTouched] = useState<Set<string>>(() => new Set());
  const [open, setOpen] = useState<Set<string>>(() =>
    students.length === 1 ? new Set([students[0].id]) : new Set(),
  );
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const dirtyIds = useMemo(
    () =>
      students
        .map((s) => s.id)
        .filter((id) => {
          const base = saved[id];
          return base ? !sameMarks(base, marks[id]) : touched.has(id);
        }),
    [students, saved, marks, touched],
  );
  const dirty = dirtyIds.length > 0;
  const markedCount = students.filter((s) => saved[s.id]).length;

  // Warn before closing the tab with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  function update(id: string, change: Partial<Marks>) {
    setMarks((m) => ({ ...m, [id]: { ...m[id], ...change } }));
    setTouched((t) => new Set(t).add(id));
    setMessage(null);
  }

  function toggleGroup(id: string, keys: readonly MarkKey[]) {
    const allOn = keys.every((k) => marks[id][k]);
    update(id, Object.fromEntries(keys.map((k) => [k, !allOn])) as Partial<Marks>);
  }

  function toggleOpen(id: string) {
    setOpen((o) => {
      const next = new Set(o);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function goTo(next: string) {
    if (dirty && !window.confirm("You have unsaved changes. Leave this date without saving?")) return;
    router.push(`/teacher?date=${next}`);
  }

  function save() {
    const ids = dirtyIds;
    const entries = ids.map((studentId) => ({ studentId, marks: marks[studentId] }));
    startTransition(async () => {
      const result = await saveDailyRecords({ date, entries });
      if (result.ok) {
        setSaved((s) => ({ ...s, ...Object.fromEntries(ids.map((id) => [id, marks[id]])) }));
        setTouched(new Set());
        setMessage({ tone: "ok", text: `Saved ${result.saved} student${result.saved === 1 ? "" : "s"}.` });
      } else {
        setMessage({ tone: "error", text: result.error });
      }
    });
  }

  // Browser-local "today"; null during server render to avoid a hydration mismatch.
  const today = useSyncExternalStore(noopSubscribe, localToday, () => null);
  const allOpen = open.size === students.length;

  return (
    <div className="pb-28">
      {/* Date bar */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Button variant="secondary" aria-label="Previous day" onClick={() => goTo(addDays(date, -1))} className="w-11 px-0">
          ‹
        </Button>
        <input
          type="date"
          value={date}
          max={today ?? undefined}
          aria-label="Date"
          onChange={(e) => e.target.value && goTo(e.target.value)}
          className="min-h-11 rounded-xl border border-gray-200 bg-white px-3 text-base text-gray-900 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 focus:outline-none sm:text-sm"
        />
        <Button
          variant="secondary"
          aria-label="Next day"
          onClick={() => goTo(addDays(date, 1))}
          disabled={today !== null && date >= today}
          className="w-11 px-0 disabled:opacity-40"
        >
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
          <span className="font-medium text-gray-900">{formatDate(date)}</span> · {markedCount}/{students.length} marked
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
          const m = marks[s.id];
          const done = countDone(m);
          const isOpen = open.has(s.id);
          const isDirty = dirtyIds.includes(s.id);
          const status = isDirty ? "unsaved" : saved[s.id] ? "saved" : "none";

          return (
            <li key={s.id} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <button
                type="button"
                onClick={() => toggleOpen(s.id)}
                aria-expanded={isOpen}
                aria-controls={`marks-${s.id}`}
                className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-gray-50"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium text-gray-900">{s.name}</p>
                    <StatusPill status={status} />
                  </div>
                  <div className="mt-2 flex items-center gap-3">
                    <ProgressBar value={done} max={TOTAL_MARKS} className="flex-1" />
                    <span className="w-12 shrink-0 text-right text-xs font-medium text-gray-600 tabular-nums">
                      {done}/{TOTAL_MARKS}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">{s.className}</p>
                </div>
                <svg
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden
                  className={`h-5 w-5 shrink-0 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                >
                  <path d="M5.2 7.2a.75.75 0 0 1 1.06 0L10 10.94l3.74-3.74a.75.75 0 1 1 1.06 1.06l-4.27 4.27a.75.75 0 0 1-1.06 0L5.2 8.26a.75.75 0 0 1 0-1.06Z" />
                </svg>
              </button>

              {isOpen && (
                <div id={`marks-${s.id}`} className="space-y-4 border-t border-gray-100 px-4 py-4">
                  <MarkGroup
                    title="Prayers"
                    items={PRAYERS}
                    marks={m}
                    onToggle={(k, v) => update(s.id, { [k]: v })}
                    onToggleAll={() => toggleGroup(s.id, PRAYERS.map((p) => p.key))}
                  />
                  <MarkGroup
                    title="Learning"
                    items={LEARNING}
                    marks={m}
                    onToggle={(k, v) => update(s.id, { [k]: v })}
                    onToggleAll={() => toggleGroup(s.id, LEARNING.map((l) => l.key))}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {/* Sticky save bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:left-64">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <p
            role="status"
            className={`min-w-0 truncate text-sm ${
              message?.tone === "error" ? "text-red-600" : dirty ? "text-amber-700" : "text-gray-500"
            }`}
          >
            {message?.text ??
              (dirty
                ? `${dirtyIds.length} student${dirtyIds.length === 1 ? "" : "s"} not saved`
                : "All changes saved")}
          </p>
          <Button onClick={save} disabled={!dirty || pending} className="shrink-0 px-6">
            {pending ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function MarkGroup({
  title,
  items,
  marks,
  onToggle,
  onToggleAll,
}: {
  title: string;
  items: readonly { key: MarkKey; label: string }[];
  marks: Marks;
  onToggle: (key: MarkKey, value: boolean) => void;
  onToggleAll: () => void;
}) {
  const done = countDone(marks, items.map((i) => i.key));
  const allOn = done === items.length;
  return (
    <fieldset>
      <div className="mb-2 flex items-center justify-between">
        <legend className="text-sm font-semibold text-gray-700">
          {title} <span className="font-normal text-gray-400">{done}/{items.length}</span>
        </legend>
        <button
          type="button"
          onClick={onToggleAll}
          className="min-h-9 rounded-lg px-2 text-sm font-medium text-brand-700 hover:bg-brand-50"
        >
          {allOn ? "Clear" : "All done"}
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {items.map((item) => (
          <CheckTile
            key={item.key}
            label={item.label}
            checked={marks[item.key]}
            onChange={(e) => onToggle(item.key, e.target.checked)}
          />
        ))}
      </div>
    </fieldset>
  );
}

function StatusPill({ status }: { status: "saved" | "unsaved" | "none" }) {
  const styles = {
    saved: "bg-brand-50 text-brand-700",
    unsaved: "bg-amber-50 text-amber-700",
    none: "bg-gray-100 text-gray-500",
  };
  const text = { saved: "Saved", unsaved: "Unsaved", none: "Not marked" };
  return (
    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${styles[status]}`}>{text[status]}</span>
  );
}
