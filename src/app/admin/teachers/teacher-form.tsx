"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import type { FormState } from "@/lib/form";

type Props = {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  initial?: { name: string; username: string };
  submitLabel: string;
};

export function TeacherForm({ action, initial, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const v = state?.values ?? initial ?? { name: "", username: "" };
  const err = state?.fieldErrors ?? {};
  const isEdit = Boolean(initial);

  return (
    // key forces inputs to pick up returned values after a failed submit
    <form key={JSON.stringify(state?.values ?? null)} action={formAction} className="space-y-5" noValidate>
      <Field label="Full name" htmlFor="name" error={err.name}>
        <Input id="name" name="name" defaultValue={v.name} invalid={!!err.name} required maxLength={100} />
      </Field>
      <Field label="Username" htmlFor="username" error={err.username} hint="Used to sign in. Lowercase letters, numbers, . _ -">
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
        hint={isEdit ? "Leave blank to keep the current password." : "At least 8 characters."}
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

      {state?.error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link
          href="/admin/teachers"
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
