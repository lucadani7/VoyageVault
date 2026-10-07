"use client";

import { useState } from "react";
import { dangerLinkClass, mutedClass, plainLinkClass } from "@/components/ui";

/**
 * A delete action that asks for a second click, since deleting cannot be
 * undone. `fields` are sent along as hidden inputs.
 */
export function ConfirmDeleteButton({
  action,
  fields = {},
  label,
  question,
  confirmLabel = "Yes, delete",
  emphasized = false,
}: {
  action: (formData: FormData) => void | Promise<void>;
  fields?: Record<string, string>;
  label: string;
  question: string;
  confirmLabel?: string;
  /** Draws a red frame around the question, for the riskier deletions. */
  emphasized?: boolean;
}) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className={dangerLinkClass}
      >
        {label}
      </button>
    );
  }

  return (
    <form
      action={action}
      className={`flex flex-wrap items-center gap-x-3 ${
        emphasized
          ? "rounded-lg border border-red-300 px-3 py-1 dark:border-red-900"
          : ""
      }`}
    >
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <span className={mutedClass}>{question}</span>
      <button type="submit" className={dangerLinkClass}>
        {confirmLabel}
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className={plainLinkClass}
      >
        Cancel
      </button>
    </form>
  );
}
