"use client";

import Link from "next/link";
import { useState } from "react";
import {
  deleteAllRecipients,
  deleteRecipient,
} from "@/app/(app)/recipients/actions";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { inputClass, mutedClass, quietLinkClass } from "@/components/ui";

export type RecipientSummary = {
  id: string;
  name: string;
  /** Already worded, e.g. "Family · Senior (65+)". */
  profile: string;
  interests: string[];
  notes: string | null;
};

// Lower-case and strip accents, so "stefan" finds "Ștefan".
const normalize = (text: string) =>
  text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

export function RecipientList({
  recipients,
}: {
  recipients: RecipientSummary[];
}) {
  const [query, setQuery] = useState("");

  const words = normalize(query).split(/\s+/).filter(Boolean);
  const visible = recipients.filter((recipient) => {
    const haystack = normalize(
      [recipient.name, recipient.profile, ...recipient.interests].join(" "),
    );
    return words.every((word) => haystack.includes(word));
  });

  return (
    <>
      <div className="mt-6">
        <input
          type="search"
          aria-label="Search people"
          placeholder="Search by name, relationship, age group or interest"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className={inputClass}
        />
      </div>

      {visible.length === 0 ? (
        <p className={`mt-6 ${mutedClass}`}>
          Nobody matches “{query.trim()}”.
        </p>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {visible.map((recipient) => (
            <li
              key={recipient.id}
              className="rounded-xl border border-zinc-200 dark:border-zinc-800"
            >
              <div className="p-5 pb-3">
                <h2 className="break-words text-lg font-semibold">
                  {recipient.name}
                </h2>
                <p className={`mt-1 ${mutedClass}`}>{recipient.profile}</p>
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {recipient.interests.map((interest) => (
                    <li
                      key={interest}
                      className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium dark:bg-zinc-800"
                    >
                      {interest}
                    </li>
                  ))}
                </ul>
                {recipient.notes && (
                  <p className="mt-3 break-words text-sm">{recipient.notes}</p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-4 border-t border-zinc-200 px-4 py-1 dark:border-zinc-800">
                <Link
                  href={`/recipients/${recipient.id}`}
                  className={quietLinkClass}
                >
                  Edit
                </Link>
                <ConfirmDeleteButton
                  action={deleteRecipient}
                  fields={{ recipientId: recipient.id }}
                  label="Delete"
                  question={`Delete ${recipient.name}?`}
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-10">
        <ConfirmDeleteButton
          action={deleteAllRecipients}
          label="Delete all people"
          question={`Delete ${
            recipients.length === 1
              ? "this person"
              : `all ${recipients.length} people`
          }? This cannot be undone.`}
          confirmLabel="Yes, delete everyone"
          emphasized
        />
      </div>
    </>
  );
}
