import { searchPlaces } from "@/lib/places";
import { getSession } from "@/lib/session";

export async function GET(request: Request) {
  if (!(await getSession())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const country = searchParams.get("country") ?? "";
  const query = (searchParams.get("q") ?? "").trim().slice(0, 100);

  try {
    return Response.json({ places: await searchPlaces(country, query) });
  } catch {
    return Response.json(
      { places: [], error: "Place search is unavailable right now." },
      { status: 502 },
    );
  }
}
