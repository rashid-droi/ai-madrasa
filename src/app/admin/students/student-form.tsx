"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import type { FormState } from "@/lib/form";

type Values = { name: string; username: string; className: string; teacherId: string };

type Props = {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  teachers: { id: string; name: string }[];
  classes: string[];
  initial?: Values;
  submitLabel: string;
};

const EMPTY: Values = { name: "", username: "", className: "", teacherId: "" };

export function StudentForm({ action, teachers, classes, initial, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const v = { ...EMPTY, ...(state?.values ?? initial) };
  const err = state?.fieldErrors ?? {};
  const isEdit = Boolean(initial);

  return (
    <form key={JSON.stringify(state?.values ?? null)} action={formAction} className="space-y-5" noValidate>
      <Field label="Full name" htmlFor="name" error={err.name}>
        <Input id="name" name="name" defaultValue={v.name} invalid={!!err.name} required maxLength={100} />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Class" htmlFor="className" error={err.className} hint="Pick an existing class or type a new one.">
          <Input
            id="className"
            name="className"
            list="class-options"
            defaultValue={v.className}
            invalid={!!err.className}
            required
            maxLength={50}
            autoComplete="off"
          />
          <datalist id="class-options">
            {classes.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </Field>

        <Field label="Teacher" htmlFor="teacherId" error={err.teacherId}>
          <Select id="teacherId" name="teacherId" defaultValue={v.teacherId} invalid={!!err.teacherId}>
            <option value="">Unassigned</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Username" htmlFor="username" error={err.username} hint="Used to sign in.">
          <Input
            id="username"
            name="username"
            defaultValue={v.username}
            invalid={!!err.username}
            autoCapitalize="none"
            autoCorrect="off"
            autoComplete="off"
            required
            maxLength={50}
          />
        </Field>
        <Field
          label={isEdit ? "New password" : "Password"}
          htmlFor="password"
          error={err.password}
          hint={isEdit ? "Leave blank to keep the current one." : "At least 8 characters."}
        >
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            invalid={!!err.password}
            required={!isEdit}
          />
        </Field>
      </div>

      {state?.error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link
          href="/admin/students"
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-gray-200 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </Link>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
