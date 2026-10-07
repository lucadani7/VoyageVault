import { authenticate, fail, ok } from "@/lib/api";
import { searchPlaces } from "@/lib/places";

/**
 * Cities and regions of one country matching the typed text. A result is
 * what POST /api/v1/trips/{id}/stops expects as `place`.
 */
export async function GET(request: Request) {
  const { user, response } = await authenticate();
  if (!user) return response;

  const { searchParams } = new URL(request.url);
  const country = (searchParams.get("country") ?? "").toUpperCase();
  const query = (searchParams.get("q") ?? "").trim().slice(0, 100);

  try {
    return ok({ places: await searchPlaces(country, query) });
  } catch {
    return fail(502, "upstream_unavailable", "Place search is unavailable right now.");
  }
}
