import { openApiDocument } from "@/lib/openapi";

/** The machine-readable description of the API. Public, like the docs. */
export function GET() {
  return Response.json(openApiDocument);
}
