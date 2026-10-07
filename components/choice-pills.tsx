"use client";

import { useEffect, useRef, useState } from "react";

const pillClass =
  "flex min-h-10 cursor-pointer items-center rounded-full border border-zinc-300 px-4 text-sm font-medium has-checked:border-zinc-900 has-checked:bg-zinc-900 has-checked:text-white has-focus-visible:ring-2 has-focus-visible:ring-zinc-400 dark:border-zinc-700 dark:has-checked:border-zinc-100 dark:has-checked:bg-zinc-100 dark:has-checked:text-zinc-900";

/**
 * A row of tappable pills that submits like radio buttons (one choice) or
 * checkboxes (`multiple`). Nothing is selected unless `defaultValue` says so.
 */
export function ChoicePills<T extends string>({
  legend,
  hint,
  name,
  options,
  defaultValue,
  multiple = false,
  required = false,
}: {
  legend: string;
  hint?: string;
  name: string;
  options: { value: T; label: string }[];
  defaultValue: T[];
  multiple?: boolean;
  required?: boolean;
}) {
  const [selected, setSelected] = useState<T[]>(defaultValue);
  const group = useRef<HTMLFieldSetElement>(null);

  // The browser's form reset can change which boxes look ticked without
  // React noticing; re-apply our state after every render.
  useEffect(() => {
    group.current
      ?.querySelectorAll<HTMLInputElement>("input")
      .forEach((input) => {
        input.checked = selected.includes(input.value as T);
      });
  });

  function toggle(value: T) {
    if (!multiple) return setSelected([value]);
    setSelected(
      selected.includes(value)
        ? selected.filter((item) => item !== value)
        : [...selected, value],
    );
  }

  return (
    <fieldset ref={group}>
      <legend className="text-sm font-medium">{legend}</legend>
      {hint && (
        <p className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-400">{hint}</p>
      )}
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => (
          <label key={option.value} className={pillClass}>
            <input
              type={multiple ? "checkbox" : "radio"}
              name={name}
              value={option.value}
              required={required && !multiple}
              checked={selected.includes(option.value)}
              onChange={() => toggle(option.value)}
              className="sr-only"
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
