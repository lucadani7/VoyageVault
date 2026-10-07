import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { auth } from "./auth";

/** The current session, or null. Looked up once per request. */
export const getSession = cache(async () =>
  auth.api.getSession({ headers: await headers() }),
);

/**
 * Use at the top of any page, server action or route handler that needs a
 * signed-in user. Sends anonymous visitors to the sign-in page.
 */
export async function requireUser() {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  return session.user;
}
