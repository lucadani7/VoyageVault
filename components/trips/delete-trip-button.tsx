"use client";

import { useState } from "react";
import { deleteTrip } from "@/app/(app)/trips/actions";
import { dangerLinkClass, mutedClass, plainLinkClass } from "@/components/ui";

/** Asks for a second click before deleting, since it cannot be undone. */
export function DeleteTripButton({
  tripId,
  label = "Delete trip",
}: {
  tripId: string;
  label?: string;
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
    <form action={deleteTrip} className="flex flex-wrap items-center gap-3">
      <input type="hidden" name="tripId" value={tripId} />
      <span className={mutedClass}>Delete this trip and all its stops?</span>
      <button type="submit" className={dangerLinkClass}>
        Yes, delete
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
