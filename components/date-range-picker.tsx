"use client";

import { DayPicker, type DateRange } from "@daypicker/react";
import "@daypicker/react/style.css";
import { useEffect, useRef, useState } from "react";
import { inputClass } from "@/components/ui";

const pad = (n: number) => String(n).padStart(2, "0");

// The form works with plain "YYYY-MM-DD" strings; the calendar works with
// Date objects in the visitor's own time zone. These two convert between
// them without ever going through UTC, so the day cannot shift.
const toIso = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const fromIso = (iso: string) => {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const shortDate = new Intl.DateTimeFormat("en", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

/**
 * One field for a start and an end date. Opens a calendar showing two
 * months side by side; the first click sets the start, the second the end.
 * The chosen dates are submitted as two hidden "YYYY-MM-DD" inputs.
 */
export function DateRangePicker({
  fromName,
  toName,
  defaultFrom = "",
  defaultTo = "",
}: {
  fromName: string;
  toName: string;
  defaultFrom?: string;
  defaultTo?: string;
}) {
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!container.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  // The library proposes a range of its own, but we decide from the clicked
  // day alone: that keeps "first click = arrival, second = departure"
  // predictable and allows arriving and leaving on the same day.
  function handleSelect(_proposed: DateRange | undefined, day: Date) {
    const iso = toIso(day);
    const startingOver = !from || Boolean(to);
    if (startingOver || iso < from) {
      setFrom(iso);
      setTo("");
      return;
    }
    setTo(iso);
    setOpen(false);
  }

  const selected: DateRange | undefined = from
    ? { from: fromIso(from), to: to ? fromIso(to) : undefined }
    : undefined;

  const summary = from
    ? `${shortDate.format(fromIso(from))} – ${
        to ? shortDate.format(fromIso(to)) : "choose departure"
      }`
    : "Select dates";

  return (
    <div ref={container} className="relative">
      <input type="hidden" name={fromName} value={from} />
      <input type="hidden" name={toName} value={to} />

      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className={`${inputClass} text-left ${from ? "" : "text-zinc-500"}`}
      >
        {summary}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Choose arrival and departure dates"
          className="date-range-popover absolute left-1/2 z-20 mt-2 w-max max-w-[calc(100vw-1rem)] -translate-x-1/2 rounded-xl border border-zinc-200 bg-white p-3 shadow-lg sm:left-0 sm:translate-x-0 sm:p-4 dark:border-zinc-700 dark:bg-zinc-900"
        >
          <p className="mb-2 text-xs font-normal text-zinc-500">
            {!from || to
              ? "Pick your arrival date"
              : "Now pick your departure date"}
          </p>
          <DayPicker
            mode="range"
            numberOfMonths={2}
            weekStartsOn={1}
            defaultMonth={from ? fromIso(from) : undefined}
            selected={selected}
            onSelect={handleSelect}
            autoFocus
          />
        </div>
      )}
    </div>
  );
}
