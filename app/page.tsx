import Link from "next/link";
import { GoogleButton } from "@/components/google-button";
import { googleEnabled } from "@/lib/auth";
import { getSession } from "@/lib/session";

export default async function Home() {
  const session = await getSession();

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
      <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
        VoyageVault
      </h1>
      <p className="mt-4 max-w-md text-lg text-zinc-600 dark:text-zinc-400">
        Souvenir ideas for every place you visit, matched to the people you
        are bringing them home to.
      </p>
      <div className="mt-8 flex w-full max-w-xs flex-col gap-3">
        {session ? (
          <Link
            href="/trips"
            className="rounded-lg bg-zinc-900 px-5 py-2.5 font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            Go to your trips
          </Link>
        ) : (
          <>
            {googleEnabled && <GoogleButton />}
            <Link
              href="/sign-up"
              className="rounded-lg bg-zinc-900 px-5 py-2.5 font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              Create account
            </Link>
            <Link
              href="/sign-in"
              className="rounded-lg border border-zinc-300 px-5 py-2.5 font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
            >
              Sign in
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
