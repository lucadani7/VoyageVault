import Link from "next/link";
import { Suspense } from "react";
import { getSession } from "@/lib/session";
import { SignOutButton } from "./sign-out-button";

async function UserMenu() {
  const session = await getSession();
  if (!session) return null;

  return (
    <div className="flex items-center gap-3">
      <span className="hidden text-sm text-zinc-600 sm:inline dark:text-zinc-400">
        {session.user.name}
      </span>
      <SignOutButton />
    </div>
  );
}

export function AppHeader() {
  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4 px-4 py-3">
        <nav className="flex items-center gap-4 sm:gap-6">
          <Link href="/trips" className="whitespace-nowrap font-semibold tracking-tight">
            VoyageVault
          </Link>
          <Link
            href="/trips"
            className="inline-flex min-h-10 items-center text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            Trips
          </Link>
          <Link
            href="/recipients"
            className="inline-flex min-h-10 items-center text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            People
          </Link>
        </nav>
        <Suspense fallback={null}>
          <UserMenu />
        </Suspense>
      </div>
    </header>
  );
}
