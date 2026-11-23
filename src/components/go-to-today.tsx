"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { localToday } from "@/lib/dates";

/** Redirects to `path?date=<today>` using the browser's own time zone. */
export function GoToToday({ path }: { path: string }) {
  const router = useRouter();
  useEffect(() => {
    router.replace(`${path}?date=${localToday()}`);
  }, [router, path]);
  return <p className="py-12 text-center text-sm text-gray-500">Loading today…</p>;
}
