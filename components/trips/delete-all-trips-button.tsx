"use client";

import { useState } from "react";
import { deleteAllTrips } from "@/app/(app)/trips/actions";
import { dangerLinkClass, mutedClass, plainLinkClass } from "@/components/ui";

/** Deletes every trip of the user, after an explicit second confirmation. */
export function DeleteAllTripsButton({ count }: { count: number }) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className={dangerLinkClass}
      >
        Delete all trips
      </button>
    );
  }

  return (
    <form
      action={deleteAllTrips}
      className="flex flex-wrap items-center gap-3 rounded-lg border border-red-300 p-3 dark:border-red-900"
    >
      <span className={mutedClass}>
        Delete {count === 1 ? "your trip" : `all ${count} trips`} and their
        stops? This cannot be undone.
      </span>
      <button type="submit" className={dangerLinkClass}>
        Yes, delete everything
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
