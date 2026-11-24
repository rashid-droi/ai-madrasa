"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { ACTIVITIES, ACTIVITY_KEYS, type ActivityKey } from "@/lib/marks";
import { saveClassTasks } from "./actions";

export type Draft = Record<ActivityKey, string>;

/**
 * Tasks for a whole class. Prefilled with the value every student shares;
 * fields where students differ start empty and are flagged.
 */
export function ClassTasksForm({
  date,
  className,
  studentDrafts,
  onSaved,
}: {
  date: string;
  className: string;
  studentDrafts: Draft[];
  onSaved: (draft: Draft) => void;
}) {
  const common = Object.fromEntries(
    ACTIVITY_KEYS.map((k) => {
      const values = new Set(studentDrafts.map((d) => d[k].trim()));
      return [k, values.size === 1 ? [...values][0] : ""];
    }),
  ) as Draft;
  const mixed = new Set(ACTIVITY_KEYS.filter((k) => new Set(studentDrafts.map((d) => d[k].trim())).size > 1));

  const [draft, setDraft] = useState<Draft>(common);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function save() {
    if (mixed.size > 0 && !window.confirm("Some students have their own tasks. Replace them with the class tasks?")) {
      return;
    }
    startTransition(async () => {
      const result = await saveClassTasks({ date, className, tasks: draft });
      if (result.ok) {
        const clean = Object.fromEntries(ACTIVITY_KEYS.map((k) => [k, draft[k].trim()])) as Draft;
        setDraft(clean);
        onSaved(clean);
        setMessage({ tone: "ok", text: `Saved for ${result.saved} student${result.saved === 1 ? "" : "s"}` });
      } else {
        setMessage({ tone: "error", text: result.error });
      }
    });
  }

  const id = (k: string) => `class-${className}-${k}`.replace(/\s+/g, "-");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
      className="space-y-3"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {ACTIVITIES.map((a) => (
          <Field
            key={a.key}
            label={a.taskLabel}
            htmlFor={id(a.key)}
            hint={mixed.has(a.key) ? "Students have different tasks here" : undefined}
          >
            <Input
              id={id(a.key)}
              value={draft[a.key]}
              placeholder={a.placeholder}
              maxLength={300}
              onChange={(e) => {
                const value = e.target.value;
                setDraft((d) => ({ ...d, [a.key]: value }));
                setMessage(null);
              }}
            />
          </Field>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-end gap-3">
        {message && (
          <p role="status" className={`text-sm ${message.tone === "error" ? "text-red-600" : "text-brand-700"}`}>
            {message.text}
          </p>
        )}
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : `Save for whole ${className}`}
        </Button>
      </div>
    </form>
  );
}
