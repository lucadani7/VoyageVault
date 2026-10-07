import type { Metadata } from "next";
import { TripForm } from "@/components/trips/trip-form";
import { mutedClass } from "@/components/ui";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "New trip · VoyageVault" };

export default async function NewTripPage() {
  await requireUser();

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">New trip</h1>
      <p className={`mt-1 ${mutedClass}`}>
        Name it now; you add the places and dates on the next screen.
      </p>
      <TripForm />
    </main>
  );
}
