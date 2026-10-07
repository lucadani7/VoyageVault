import { authenticate, invalid, notFound, ok, readJson } from "@/lib/api";
import {
  buildExport,
  CONTENT_TYPES,
  EXPORT_FORMATS,
  pickFormat,
  render,
} from "@/lib/export/recommendations";
import { getTripRecommendations, saveDecision } from "@/lib/recommendations";
import { validateDecision } from "@/lib/validation";

type Context = { params: Promise<{ id: string }> };

/**
 * The recommended souvenirs for every stop and person of a trip, as JSON,
 * CSV, XML or HTML. Choose with `?format=` or the Accept header; add
 * `?download=1` to have the browser save it as a file.
 */
export async function GET(request: Request, { params }: Context) {
  const { user, response } = await authenticate();
  if (!user) return response;

  const url = new URL(request.url);
  const format = pickFormat(
    url.searchParams.get("format"),
    request.headers.get("accept"),
  );
  if (!format) {
    return invalid(`format must be one of: ${EXPORT_FORMATS.join(", ")}.`);
  }

  const data = await getTripRecommendations(user.id, (await params).id);
  if (!data) return notFound("Trip");

  const document = buildExport(data, new Date());
  const headers = new Headers({
    "Content-Type": CONTENT_TYPES[format],
    // The list is personal and changes with every decision.
    "Cache-Control": "private, no-store",
    Vary: "Accept",
  });
  if (url.searchParams.has("download")) {
    // Keep the file name to plain characters, whatever the trip is called.
    const name = data.trip.name.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "");
    headers.set(
      "Content-Disposition",
      `attachment; filename="${name || "trip"}-souvenirs.${format}"`,
    );
  }
  return new Response(render(document, format), { headers });
}

/** Mark one suggestion as bought, dismissed, or suggested again. */
export async function PUT(request: Request, { params }: Context) {
  const { user, response } = await authenticate();
  if (!user) return response;
  const { body, response: bodyError } = await readJson(request);
  if (!body) return bodyError;

  const decision = validateDecision(body);
  if (!decision.ok) return invalid(decision.error);

  const saved = await saveDecision(user.id, (await params).id, decision.value);
  return saved ? ok({ decision: decision.value }) : notFound("Trip, stop, person or souvenir");
}
