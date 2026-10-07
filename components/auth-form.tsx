"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { authClient } from "@/lib/auth-client";
import { GoogleButton } from "./google-button";

type Mode = "sign-in" | "sign-up";

type FormState = {
  error: string | null;
  name: string;
  email: string;
};

const inputClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-base outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-100";

export function AuthForm({
  mode,
  googleEnabled,
}: {
  mode: Mode;
  googleEnabled: boolean;
}) {
  const router = useRouter();
  const isSignUp = mode === "sign-up";

  const [state, formAction, pending] = useActionState<FormState, FormData>(
    async (_previous, formData) => {
      const name = String(formData.get("name") ?? "").trim();
      const email = String(formData.get("email") ?? "").trim();
      const password = String(formData.get("password") ?? "");

      const { error } = isSignUp
        ? await authClient.signUp.email({ name, email, password })
        : await authClient.signIn.email({ email, password });

      if (error) {
        return {
          error: error.message ?? "Something went wrong. Please try again.",
          name,
          email,
        };
      }

      router.push("/trips");
      router.refresh();
      return { error: null, name, email };
    },
    { error: null, name: "", email: "" },
  );

  return (
    <div className="w-full max-w-sm">
      <h1 className="text-2xl font-semibold tracking-tight">
        {isSignUp ? "Create your account" : "Welcome back"}
      </h1>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        {isSignUp
          ? "Plan souvenirs for every stop of your trip."
          : "Sign in to see your trips."}
      </p>

      {googleEnabled && (
        <>
          <div className="mt-6">
            <GoogleButton disabled={pending} />
          </div>
          <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wide text-zinc-500">
            <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
            or
            <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
          </div>
        </>
      )}

      <form action={formAction} className={googleEnabled ? "" : "mt-6"}>
        <div className="flex flex-col gap-4">
          {isSignUp && (
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Name
              <input
                name="name"
                type="text"
                autoComplete="name"
                required
                defaultValue={state.name}
                className={inputClass}
              />
            </label>
          )}
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Email
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              defaultValue={state.email}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Password
            <input
              name="password"
              type="password"
              autoComplete={isSignUp ? "new-password" : "current-password"}
              required
              minLength={8}
              className={inputClass}
            />
            {isSignUp && (
              <span className="text-xs font-normal text-zinc-500">
                At least 8 characters.
              </span>
            )}
          </label>
        </div>

        {state.error && (
          <p role="alert" className="mt-4 text-sm text-red-600 dark:text-red-400">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="mt-6 w-full rounded-lg bg-zinc-900 px-4 py-2.5 font-medium text-white hover:bg-zinc-700 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {pending
            ? "Please wait…"
            : isSignUp
              ? "Create account"
              : "Sign in"}
        </button>
      </form>

      <p className="mt-6 text-sm text-zinc-600 dark:text-zinc-400">
        {isSignUp ? "Already have an account? " : "New to VoyageVault? "}
        <Link
          href={isSignUp ? "/sign-in" : "/sign-up"}
          className="font-medium text-zinc-900 underline underline-offset-4 dark:text-zinc-100"
        >
          {isSignUp ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </div>
  );
}
