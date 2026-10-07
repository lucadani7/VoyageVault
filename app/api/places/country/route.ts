import { getCountryView } from "@/lib/places";
import { getSession } from "@/lib/session";

export async function GET(request: Request) {
  if (!(await getSession())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const code = new URL(request.url).searchParams.get("code") ?? "";

  try {
    return Response.json({ view: await getCountryView(code) });
  } catch {
    return Response.json({ view: null }, { status: 502 });
  }
}
