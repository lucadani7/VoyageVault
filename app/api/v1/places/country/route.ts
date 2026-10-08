import { authenticate, fail, notFound, ok } from "@/lib/api";
import { getCountryView } from "@/lib/places";

/** Where to point a map for a country: its centre and, if compact, its outline. */
export async function GET(request: Request) {
  const { user, response } = await authenticate();
  if (!user) return response;

  const code = (new URL(request.url).searchParams.get("code") ?? "").toUpperCase();
  try {
    const view = await getCountryView(code);
    return view ? ok({ view }) : notFound("Country");
  } catch {
    return fail(502, "upstream_unavailable", "Place search is unavailable right now.");
  }
}
