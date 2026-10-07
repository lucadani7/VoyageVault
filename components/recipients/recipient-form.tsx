"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  type RecipientFormState,
  type RecipientFormValues,
  saveRecipient,
} from "@/app/(app)/recipients/actions";
import { ChoicePills } from "@/components/choice-pills";
import {
  errorClass,
  inputClass,
  labelClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/ui";
import {
  AGE_GROUP_LABELS,
  AGE_GROUPS,
  INTEREST_LABELS,
  INTEREST_TAGS,
  RELATIONSHIP_LABELS,
  RELATIONSHIPS,
} from "@/lib/vocabulary";

const emptyValues: RecipientFormValues = {
  name: "",
  relationship: "",
  ageGroup: "",
  interests: [],
  notes: "",
};

/** Used both to add a person and, when `recipientId` is given, to edit one. */
export function RecipientForm({
  recipientId,
  initialValues = emptyValues,
}: {
  recipientId?: string;
  initialValues?: RecipientFormValues;
}) {
  const initialState: RecipientFormState = {
    error: null,
    version: 0,
    values: initialValues,
  };
  const [state, formAction, pending] = useActionState(
    saveRecipient,
    initialState,
  );
  const { values } = state;

  return (
    <form action={formAction} className="mt-6 flex flex-col gap-6">
      {recipientId && (
        <input type="hidden" name="recipientId" value={recipientId} />
      )}

      {/* Remounted after each submission so a rejected form keeps what was
          entered instead of being cleared by the browser. */}
      <div key={state.version} className="flex flex-col gap-6">
        <label className={labelClass}>
          Name
          <input
            name="name"
            type="text"
            required
            maxLength={100}
            placeholder="Grandma Maria"
            defaultValue={values.name}
            className={inputClass}
          />
        </label>

        <ChoicePills
          legend="Relationship"
          name="relationship"
          required
          options={RELATIONSHIPS.map((value) => ({
            value,
            label: RELATIONSHIP_LABELS[value],
          }))}
          defaultValue={values.relationship ? [values.relationship] : []}
        />

        <ChoicePills
          legend="Age group"
          name="ageGroup"
          required
          options={AGE_GROUPS.map((value) => ({
            value,
            label: AGE_GROUP_LABELS[value],
          }))}
          defaultValue={values.ageGroup ? [values.ageGroup] : []}
        />

        <ChoicePills
          legend="Interests"
          hint="Choose everything that fits; at least one."
          name="interests"
          multiple
          options={INTEREST_TAGS.map((value) => ({
            value,
            label: INTEREST_LABELS[value],
          }))}
          defaultValue={values.interests}
        />

        <label className={labelClass}>
          Notes (optional)
          <textarea
            name="notes"
            rows={3}
            maxLength={500}
            placeholder="Collects fridge magnets, allergic to nuts…"
            defaultValue={values.notes}
            className={inputClass}
          />
        </label>
      </div>

      {state.error && (
        <p role="alert" className={errorClass}>
          {state.error}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={pending} className={primaryButtonClass}>
          {pending ? "Saving…" : recipientId ? "Save changes" : "Add person"}
        </button>
        <Link href="/recipients" className={secondaryButtonClass}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
