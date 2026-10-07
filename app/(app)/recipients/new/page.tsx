import type { Metadata } from "next";
import { RecipientForm } from "@/components/recipients/recipient-form";
import { mutedClass } from "@/components/ui";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Add person · VoyageVault" };

export default async function NewRecipientPage() {
  await requireUser();

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Add person</h1>
      <p className={`mt-1 ${mutedClass}`}>
        The more you say about them, the better the souvenir suggestions.
      </p>
      <RecipientForm />
    </main>
  );
}
