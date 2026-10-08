"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  saveStop,
  type StopFormState,
  type StopFormValues,
} from "@/app/(app)/trips/actions";
import { DateRangePicker } from "@/components/date-range-picker";
import { PlacePicker } from "@/components/trips/place-picker";
import { VISIT_STATUS_LABELS, VISIT_STATUSES } from "@/lib/visit-status";
import {
  errorClass,
  inputClass,
  labelClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/ui";

type Country = { code: string; name: string };

const initialState: StopFormState = {
  error: null,
  version: 0,
  values: {
    countryCode: "",
    place: null,
    visitStatus: "",
    arrivalDate: "",
    departureDate: "",
  },
};

/**
 * The inputs of one stop. Remounted (via `key`) after every submission so
 * that a saved stop leaves a clean form and a rejected one keeps its values.
 */
function StopFields({
  countries,
  values,
}: {
  countries: Country[];
  values: StopFormState["values"];
}) {
  // Starts empty on purpose: no country is ever preselected, and the form
  // cannot be submitted until the user has picked one themselves.
  const [countryCode, setCountryCode] = useState(values.countryCode);
  const [visitStatus, setVisitStatus] = useState(values.visitStatus);
  const select = useRef<HTMLSelectElement>(null);
  const statusGroup = useRef<HTMLFieldSetElement>(null);

  // The browser's form reset can change what the <select> displays without
  // React noticing. Re-apply our value after every render so the two can
  // never disagree.
  useEffect(() => {
    if (select.current && select.current.value !== countryCode) {
      select.current.value = countryCode;
    }
    statusGroup.current
      ?.querySelectorAll<HTMLInputElement>("input[type=radio]")
      .forEach((radio) => {
        radio.checked = radio.value === visitStatus;
      });
  });

  return (
    <>
      <label className={labelClass}>
        Country
        <select
          ref={select}
          name="countryCode"
          required
          value={countryCode}
          onChange={(event) => setCountryCode(event.target.value)}
          className={`${inputClass} ${countryCode ? "" : "text-zinc-500"}`}
        >
          {/* Not `disabled`: when the browser resets the form after a
              submission it skips disabled options and would land on the
              first real country instead of this empty choice. */}
          <option value="" hidden>
            Choose a country
          </option>
          {countries.map((country) => (
            <option key={country.code} value={country.code}>
              {country.name}
            </option>
          ))}
        </select>
      </label>

      {countryCode && (
        <PlacePicker
          // A new country means a new map and no carried-over place.
          key={countryCode}
          countryCode={countryCode}
          defaultPlace={
            countryCode === values.countryCode ? values.place : null
          }
        />
      )}

      <fieldset ref={statusGroup} className="flex flex-col gap-1.5">
        <legend className="mb-1.5 text-sm font-medium">Status</legend>
        <div className="flex flex-wrap gap-2">
          {VISIT_STATUSES.map((status) => (
            <label
              key={status}
              className="flex min-h-10 cursor-pointer items-center rounded-full border border-zinc-300 px-4 text-sm font-medium has-checked:border-zinc-900 has-checked:bg-zinc-900 has-checked:text-white has-focus-visible:ring-2 has-focus-visible:ring-zinc-400 dark:border-zinc-700 dark:has-checked:border-zinc-100 dark:has-checked:bg-zinc-100 dark:has-checked:text-zinc-900"
            >
              <input
                type="radio"
                name="visitStatus"
                value={status}
                required
                checked={visitStatus === status}
                onChange={() => setVisitStatus(status)}
                className="sr-only"
              />
              {VISIT_STATUS_LABELS[status]}
            </label>
          ))}
        </div>
      </fieldset>

      <div className={labelClass}>
        Dates
        <DateRangePicker
          fromName="arrivalDate"
          toName="departureDate"
          defaultFrom={values.arrivalDate}
          defaultTo={values.departureDate}
        />
      </div>
    </>
  );
}

/** Adds a stop to a trip or, given `stopId` and its values, edits one. */
export function StopForm({
  tripId,
  countries,
  stopId,
  initialValues,
}: {
  tripId: string;
  countries: Country[];
  stopId?: string;
  initialValues?: StopFormValues;
}) {
  const [state, formAction, pending] = useActionState(saveStop, {
    ...initialState,
    values: initialValues ?? initialState.values,
  });

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="tripId" value={tripId} />
      {stopId && <input type="hidden" name="stopId" value={stopId} />}

      <StopFields
        key={state.version}
        countries={countries}
        values={state.values}
      />

      {state.error && (
        <p role="alert" className={errorClass}>
          {state.error}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={pending} className={primaryButtonClass}>
          {pending ? "Saving…" : stopId ? "Save changes" : "Add stop"}
        </button>
        {stopId && (
          <Link href={`/trips/${tripId}`} className={secondaryButtonClass}>
            Cancel
          </Link>
        )}
      </div>
    </form>
  );
}
