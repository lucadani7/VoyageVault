"use client";

import Link from "next/link";
import { useActionState } from "react";
import { createTrip } from "@/app/(app)/trips/actions";
import {
  errorClass,
  inputClass,
  labelClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/ui";

export function TripForm() {
  const [state, formAction, pending] = useActionState(createTrip, {
    error: null,
    name: "",
  });

  return (
    <form action={formAction} className="mt-6 flex flex-col gap-4">
      <label className={labelClass}>
        Trip name
        <input
          name="name"
          type="text"
          required
          maxLength={100}
          autoFocus
          placeholder="Summer in Italy"
          defaultValue={state.name}
          className={inputClass}
        />
      </label>

      {state.error && (
        <p role="alert" className={errorClass}>
          {state.error}
        </p>
      )}

      <div className="flex gap-3">
        <button type="submit" disabled={pending} className={primaryButtonClass}>
          {pending ? "Creating…" : "Create trip"}
        </button>
        <Link href="/trips" className={secondaryButtonClass}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
