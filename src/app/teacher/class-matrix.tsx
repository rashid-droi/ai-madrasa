import { TickTime } from "@/components/tick-time";
import { ACTIVITIES, PRAYERS, type MarkKey, type Marks, type TickTimes } from "@/lib/marks";

type Row = { id: string; name: string; marks: Marks; times: TickTimes };

const SHORT: Partial<Record<MarkKey, string>> = {
  homework: "Homework",
  unitReading: "Unit",
  quranReading: "Quran",
  writing: "Writing",
  dikrByheart: "Dikr",
  quranHifz: "Hifz",
};

const COLUMNS = [
  ...PRAYERS.map((p) => ({ key: p.key as MarkKey, label: p.label, full: p.label })),
  ...ACTIVITIES.map((a) => ({
    key: a.key as MarkKey,
    label: SHORT[a.key] ?? a.label,
    full: a.label,
  })),
];

/**
 * Class completion table: every student against every prayer and activity,
 * with the time each was ticked and a done count per column.
 */
export function ClassMatrix({ date, rows }: { date: string; rows: Row[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="w-full min-w-[720px] border-collapse text-sm">
        <thead>
          <tr className="bg-gray-50 text-xs text-gray-600">
            <th scope="col" className="sticky left-0 z-10 bg-gray-50 px-3 py-2 text-left font-semibold">
              Student
            </th>
            {COLUMNS.map((c, i) => (
              <th
                key={c.key}
                scope="col"
                title={c.full}
                className={`px-1.5 py-2 text-center font-semibold ${i === PRAYERS.length ? "border-l border-gray-200" : ""}`}
              >
                {c.label}
              </th>
            ))}
          </tr>
          <tr className="border-b border-gray-200 text-xs">
            <th scope="row" className="sticky left-0 z-10 bg-white px-3 py-1.5 text-left font-medium text-gray-500">
              Done
            </th>
            {COLUMNS.map((c, i) => {
              const done = rows.filter((r) => r.marks[c.key]).length;
              const all = done === rows.length && rows.length > 0;
              return (
                <td
                  key={c.key}
                  className={`px-1.5 py-1.5 text-center font-semibold tabular-nums ${all ? "text-brand-700" : "text-gray-700"} ${
                    i === PRAYERS.length ? "border-l border-gray-200" : ""
                  }`}
                >
                  {done}/{rows.length}
                </td>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((r) => (
            <tr key={r.id}>
              <th
                scope="row"
                className="sticky left-0 z-10 max-w-36 truncate bg-white px-3 py-2 text-left font-medium text-gray-900"
              >
                {r.name}
              </th>
              {COLUMNS.map((c, i) => {
                const on = r.marks[c.key];
                const at = r.times[c.key];
                return (
                  <td
                    key={c.key}
                    className={`px-1 py-1.5 text-center align-top ${i === PRAYERS.length ? "border-l border-gray-200" : ""}`}
                  >
                    {on ? (
                      <span className="flex flex-col items-center rounded-md bg-brand-50 px-1 py-1 text-brand-700">
                        <span aria-hidden className="text-xs font-bold">
                          ✓
                        </span>
                        <span className="sr-only">{c.full} done</span>
                        {at ? (
                          <TickTime iso={at} recordDate={date} />
                        ) : (
                          <span className="text-[10px] text-gray-400">no time</span>
                        )}
                      </span>
                    ) : (
                      <span className="text-gray-300">
                        –<span className="sr-only">{c.full} not done</span>
                      </span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
