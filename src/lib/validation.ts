import { z } from "zod";

export const idSchema = z.string().trim().min(1).max(50);

export const nameSchema = z
  .string()
  .trim()
  .min(2, "Name must be at least 2 characters")
  .max(100, "Name must be at most 100 characters");

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Username must be at least 3 characters")
  .max(50, "Username must be at most 50 characters")
  .regex(/^[a-z0-9._-]+$/, "Use only letters, numbers, dots, dashes and underscores");

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(200, "Password is too long");

/** On edit forms an empty password means "keep the current one". */
export const optionalPasswordSchema = z
  .string()
  .transform((v) => (v === "" ? undefined : v))
  .pipe(passwordSchema.optional());

export const classNameSchema = z
  .string()
  .trim()
  .min(1, "Enter a class")
  .max(50, "Class must be at most 50 characters");

/** Select value: "" means none. */
export const optionalIdSchema = z
  .string()
  .trim()
  .max(50)
  .transform((v) => (v === "" ? null : v));
