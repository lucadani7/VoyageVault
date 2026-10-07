"use client";

import { useActionState, useState } from "react";
import { renameTrip } from "@/app/(app)/trips/actions";
import {
  errorClass,
  inputClass,
  primaryButtonClass,
  quietLinkClass,
  secondaryButtonClass,
} from "@/components/ui";

/** The trip's name as a heading, with an inline form to rename it. */
export function TripTitle({ tripId, name }: { tripId: string; name: string }) {
  const [editing, setEditing] = useState(false);

  const [state, formAction, pending] = useActionState(
    async (_previous: { error: string | null }, formData: FormData) => {
      const result = await renameTrip(formData);
      if (!result.error) setEditing(false);
      return result;
    },
    { error: null },
  );

  if (!editing) {
    return (
      <div className="flex flex-wrap items-center gap-x-3">
        <h1 className="text-2xl font-semibold tracking-tight">{name}</h1>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className={quietLinkClass}
        >
          Rename
        </button>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="tripId" value={tripId} />
      <input
        name="name"
        type="text"
        required
        maxLength={100}
        autoFocus
        aria-label="Trip name"
        defaultValue={name}
        className={`${inputClass} text-xl font-semibold`}
      />
      {state.error && (
        <p role="alert" className={errorClass}>
          {state.error}
        </p>
      )}
      <div className="flex gap-3">
        <button type="submit" disabled={pending} className={primaryButtonClass}>
          {pending ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className={secondaryButtonClass}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
