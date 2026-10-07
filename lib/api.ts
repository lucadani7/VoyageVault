import { getSession } from "./session";

/**
 * Small helpers shared by every /api/v1 route: one error shape, one way to
 * require a signed-in user, one way to read a JSON body.
 */

export type ApiError = { error: { code: string; message: string } };

export function ok(data: unknown, status = 200): Response {
  return Response.json(data, { status });
}

export function fail(status: number, code: string, message: string): Response {
  return Response.json({ error: { code, message } } satisfies ApiError, {
    status,
  });
}

export const notFound = (what: string) =>
  fail(404, "not_found", `${what} not found.`);

export const invalid = (message: string) => fail(400, "invalid_request", message);

/** The signed-in user, or a ready-made 401 response. */
export async function authenticate() {
  const session = await getSession();
  if (!session) {
    return {
      user: null,
      response: fail(401, "unauthorized", "Sign in to use the API."),
    } as const;
  }
  return { user: session.user, response: null } as const;
}

/**
 * Reads a JSON object from the request body. Insisting on the JSON content
 * type also means a form on another website cannot submit to the API.
 */
export async function readJson(
  request: Request,
): Promise<{ body: Record<string, unknown>; response: null } | { body: null; response: Response }> {
  const type = request.headers.get("content-type") ?? "";
  if (!type.toLowerCase().startsWith("application/json")) {
    return {
      body: null,
      response: fail(415, "unsupported_media_type", "Send the body as application/json."),
    };
  }
  try {
    const body: unknown = await request.json();
    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      return { body: null, response: invalid("The body must be a JSON object.") };
    }
    return { body: body as Record<string, unknown>, response: null };
  } catch {
    return { body: null, response: invalid("The body is not valid JSON.") };
  }
}
