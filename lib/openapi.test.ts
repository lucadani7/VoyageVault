import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { openApiDocument } from "./openapi";

const API_ROOT = join(process.cwd(), "app", "api", "v1");
const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;
// Routes that serve the documentation itself rather than data.
const UNDOCUMENTED = new Set(["/openapi.json", "/docs"]);

/** Every route.ts under app/api/v1, as "/trips/{id}" plus its HTTP methods. */
function implementedRoutes(dir = API_ROOT, prefix = ""): Map<string, string[]> {
  const routes = new Map<string, string[]>();
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      const segment = entry.name.replace(/^\[(.+)\]$/, "{$1}");
      for (const [path, methods] of implementedRoutes(join(dir, entry.name), `${prefix}/${segment}`)) {
        routes.set(path, methods);
      }
    } else if (entry.name === "route.ts") {
      const source = readFileSync(join(dir, entry.name), "utf8");
      routes.set(
        prefix,
        METHODS.filter((method) =>
          new RegExp(`export (async function|const) ${method}\\b`).test(source),
        ),
      );
    }
  }
  return routes;
}

describe("OpenAPI document", () => {
  const implemented = implementedRoutes();
  const documented = openApiDocument.paths as Record<string, Record<string, unknown>>;

  it("finds the API routes on disk", () => {
    assert.ok(existsSync(API_ROOT));
    assert.ok(implemented.size >= 10);
  });

  it("documents every route and method that exists", () => {
    for (const [path, methods] of implemented) {
      if (UNDOCUMENTED.has(path)) continue;
      assert.ok(documented[path], `${path} is implemented but not documented`);
      for (const method of methods) {
        assert.ok(documented[path][method.toLowerCase()], `${method} ${path} is not documented`);
      }
    }
  });

  it("documents nothing that does not exist", () => {
    for (const [path, operations] of Object.entries(documented)) {
      const methods = implemented.get(path);
      assert.ok(methods, `${path} is documented but has no route file`);
      for (const method of METHODS) {
        if (operations[method.toLowerCase()]) {
          assert.ok(methods.includes(method), `${method} ${path} is documented but not implemented`);
        }
      }
    }
  });

  it("only refers to schemas that are defined", () => {
    const defined = new Set(Object.keys(openApiDocument.components.schemas));
    const refs = JSON.stringify(openApiDocument).matchAll(/#\/components\/schemas\/(\w+)/g);
    for (const [, name] of refs) assert.ok(defined.has(name), `schema ${name} is not defined`);
  });
});
