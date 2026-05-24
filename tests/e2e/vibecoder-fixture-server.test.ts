import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { readFile } from "node:fs/promises";
import { createServer, type Server } from "node:http";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { runAudit } from "../../src/audit";

const __dirname = dirname(fileURLToPath(import.meta.url));

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  const fixtureDir = join(__dirname, "..", "audit", "fixtures", "vibecoder");

  server = createServer(async (req, res) => {
    const path = new URL(req.url ?? "/", "http://localhost").pathname;
    const file = path === "/lovable" ? "lovable-preview.html"
      : path === "/v0" ? "v0-default.html"
      : path === "/bolt" ? "bolt-built.html"
      : path === "/bolt/sitemap.xml" ? "bolt-sitemap-empty.xml"
      : path === "/bolt-phantom/sitemap.xml" ? "bolt-sitemap-phantom.xml"
      : null;
    if (!file) {
      res.writeHead(404, { "content-type": "text/plain" });
      res.end("not found");
      return;
    }
    const body = await readFile(join(fixtureDir, file), "utf-8");
    const ct = file.endsWith(".xml") ? "application/xml" : "text/html";
    res.writeHead(200, { "content-type": ct });
    res.end(body);
  });

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const addr = server.address();
  const port = typeof addr === "object" && addr ? addr.port : 0;
  baseUrl = `http://127.0.0.1:${port}`;
});

afterAll(() => {
  server.close();
});

describe("E2E vibecoder fixtures", () => {
  it("Lovable preview emits page-noindex AND fix is decorated with Lovable-specific tip", async () => {
    const result = await runAudit(`${baseUrl}/lovable`);
    const noindex = result.findings.find((f) => f.id === "page-noindex");
    expect(noindex).toBeDefined();
    // The fixture sets the canonical to a *.lovable.app URL, so detectAiTool returns "lovable".
    // Confirm decoration occurred.
    expect(noindex!.recommendation).toMatch(/Lovable/);
    expect(result.findings.some((f) => f.id === "page-title-default")).toBe(false);
  });

  it("v0 default emits page-title-default + page-canonical-localhost + page-empty-source-html + mobile-viewport-missing", async () => {
    const result = await runAudit(`${baseUrl}/v0`);
    const ids = new Set(result.findings.map((f) => f.id));
    expect(ids.has("page-title-default")).toBe(true);
    expect(ids.has("page-canonical-localhost")).toBe(true);
    expect(ids.has("page-empty-source-html")).toBe(true);
    expect(ids.has("mobile-viewport-missing")).toBe(true);
  });

  it("Bolt-built emits content-boilerplate-hero + analytics-measurement-id-placeholder + schema-jsonld-missing", async () => {
    const result = await runAudit(`${baseUrl}/bolt`);
    const ids = new Set(result.findings.map((f) => f.id));
    expect(ids.has("content-boilerplate-hero")).toBe(true);
    expect(ids.has("analytics-measurement-id-placeholder")).toBe(true);
    // Bolt fixture has no JSON-LD at all → schema module emits schema-jsonld-missing
    // (schema-missing-organization fires only when JSON-LD exists on the homepage without an Organization node).
    expect(ids.has("schema-jsonld-missing")).toBe(true);
  });
});
