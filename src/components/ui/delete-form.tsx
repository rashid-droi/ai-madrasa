"use client";

import { useActionState } from "react";
import { Button } from "./button";

/** Delete button that asks for confirmation before calling the server action. */
export function DeleteForm({
  action,
  label,
  confirmText,
}: {
  action: () => Promise<{ error?: string } | undefined>;
  label: string;
  confirmText: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!window.confirm(confirmText)) e.preventDefault();
      }}
    >
      {state?.error && <p className="mb-3 text-sm text-red-600">{state.error}</p>}
      <Button type="submit" variant="danger" disabled={pending}>
        {pending ? "Deleting…" : label}
      </Button>
    </form>
  );
}
