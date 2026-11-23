"use client";

import { useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

/**
 * Shows when an item was ticked, in the viewer's own time zone.
 * Adds the date when the tick happened on a different day than the record.
 */
export function TickTime({ iso, recordDate }: { iso: string; recordDate: string }) {
  const text = useSyncExternalStore(
    noopSubscribe,
    () => format(iso, recordDate),
    () => null, // server render: time zone unknown
  );
  return (
    <time dateTime={iso} className="text-xs text-gray-500 tabular-nums" suppressHydrationWarning>
      {text ?? " "}
    </time>
  );
}

function format(iso: string, recordDate: string) {
  const d = new Date(iso);
  const time = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  const local = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  if (local === recordDate) return time;
  const day = d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
  return `${day}, ${time}`;
}
