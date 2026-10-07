import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RecipientForm } from "@/components/recipients/recipient-form";
import { getRecipient } from "@/lib/recipients";
import { requireUser } from "@/lib/session";

type Props = { params: Promise<{ id: string }> };

export const metadata: Metadata = { title: "Edit person · VoyageVault" };

export default async function EditRecipientPage({ params }: Props) {
  const user = await requireUser();
  const recipient = await getRecipient(user.id, (await params).id);
  if (!recipient) notFound();

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 py-10">
      <h1 className="break-words text-2xl font-semibold tracking-tight">
        Edit {recipient.name}
      </h1>
      <RecipientForm
        recipientId={recipient.id}
        initialValues={{
          name: recipient.name,
          relationship: recipient.relationship,
          ageGroup: recipient.ageGroup,
          interests: recipient.interests,
          notes: recipient.notes ?? "",
        }}
      />
    </main>
  );
}
