import type { Metadata } from "next";
import Link from "next/link";
import {
  RecipientList,
  type RecipientSummary,
} from "@/components/recipients/recipient-list";
import { mutedClass, primaryButtonClass } from "@/components/ui";
import { getRecipients } from "@/lib/recipients";
import { requireUser } from "@/lib/session";
import {
  AGE_GROUP_LABELS,
  INTEREST_LABELS,
  RELATIONSHIP_LABELS,
} from "@/lib/vocabulary";

export const metadata: Metadata = { title: "People · VoyageVault" };

export default async function RecipientsPage() {
  const user = await requireUser();
  const recipients = await getRecipients(user.id);

  const summaries: RecipientSummary[] = recipients.map((recipient) => ({
    id: recipient.id,
    name: recipient.name,
    profile: `${RELATIONSHIP_LABELS[recipient.relationship]} · ${
      AGE_GROUP_LABELS[recipient.ageGroup]
    }`,
    interests: recipient.interests.map((tag) => INTEREST_LABELS[tag] ?? tag),
    notes: recipient.notes,
  }));

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">People</h1>
          <p className={`mt-1 ${mutedClass}`}>
            Everyone you bring souvenirs home for.
          </p>
        </div>
        <Link href="/recipients/new" className={primaryButtonClass}>
          Add person
        </Link>
      </div>

      {summaries.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-zinc-300 p-10 text-center dark:border-zinc-700">
          <p className="font-medium">Nobody here yet</p>
          <p className={`mt-1 ${mutedClass}`}>
            Add family, friends or colleagues and what they like; suggestions
            are matched to each of them.
          </p>
        </div>
      ) : (
        <RecipientList recipients={summaries} />
      )}
    </main>
  );
}
