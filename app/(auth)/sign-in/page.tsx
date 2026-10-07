import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { googleEnabled } from "@/lib/auth";
import { getSession } from "@/lib/session";

export const metadata: Metadata = { title: "Sign in · VoyageVault" };

export default async function SignInPage() {
  if (await getSession()) redirect("/trips");

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <AuthForm mode="sign-in" googleEnabled={googleEnabled} />
    </main>
  );
}
