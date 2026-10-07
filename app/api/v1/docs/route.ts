/**
 * Interactive API documentation: Swagger UI reading /api/v1/openapi.json.
 * "Try it out" uses your browser's session, so sign in to the site first.
 */
const page = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>VoyageVault API</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">
    <style>body { margin: 0; } .fallback { font: 16px/1.5 system-ui, sans-serif; padding: 2rem; }</style>
  </head>
  <body>
    <div id="docs">
      <p class="fallback">
        Loading the documentation… If nothing appears, the description is
        available as <a href="/api/v1/openapi.json">openapi.json</a>.
      </p>
    </div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
      if (window.SwaggerUIBundle) {
        SwaggerUIBundle({ url: "/api/v1/openapi.json", dom_id: "#docs", deepLinking: true });
      }
    </script>
  </body>
</html>
`;

export function GET() {
  return new Response(page, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
