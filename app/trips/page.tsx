import type { Metadata } from "next";
import { SignOutButton } from "@/components/sign-out-button";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Your trips · VoyageVault" };

export default async function TripsPage() {
  const user = await requireUser();

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Your trips</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Signed in as {user.name} ({user.email})
          </p>
        </div>
        <SignOutButton />
      </header>
      <p className="mt-10 rounded-xl border border-dashed border-zinc-300 p-8 text-center text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
        No trips yet. Adding trips comes in the next step.
      </p>
    </main>
  );
}
