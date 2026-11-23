import type { z } from "zod";
import { Prisma } from "@/generated/prisma/client";

/** State returned by server actions to forms (never contains passwords). */
export type FormState =
  | {
      error?: string;
      fieldErrors?: Record<string, string>;
      values?: Record<string, string>;
    }
  | undefined;

/** Read plain string fields from FormData (files and missing keys become ""). */
export function readFields<K extends string>(formData: FormData, keys: readonly K[]) {
  const out = {} as Record<K, string>;
  for (const key of keys) {
    const v = formData.get(key);
    out[key] = typeof v === "string" ? v : "";
  }
  return out;
}

/** First error message per field. */
export function fieldErrorsOf(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

/** Copy of submitted values with secrets removed, to refill the form. */
export function safeValues(values: Record<string, string>): Record<string, string> {
  const { password: _password, ...rest } = values;
  void _password;
  return rest;
}

export function isUniqueViolation(e: unknown): boolean {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";
}

