import { createServer } from "node:http";

const PAGES: Record<string, { status: number; body: string; type: string }> = {
  "/": {
    status: 200, type: "text/html",
    body: `<!doctype html><html lang="en"><head><title>Home</title><meta name="description" content="Home page of the fixture site."></head>
    <body><h1>Home</h1><a href="/about">About</a><a href="/contact">Contact</a><a href="/admin/secret">Admin</a></body></html>`,
  },
  "/about": {
    status: 200, type: "text/html",
    body: `<!doctype html><html lang="en"><head><title>About</title><meta name="description" content="About us page."></head>
    <body><h1>About</h1><a href="/">Home</a></body></html>`,
  },
  "/contact": {
    status: 200, type: "text/html",
    body: `<!doctype html><html lang="en"><head><title>Contact</title><meta name="description" content="Contact us."></head>
    <body><h1>Contact</h1><a href="/">Home</a></body></html>`,
  },
  "/sitemap.xml": {
    status: 200, type: "application/xml",
    body: `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>__ORIGIN__/</loc></url>
  <url><loc>__ORIGIN__/about</loc></url>
  <url><loc>__ORIGIN__/contact</loc></url>
  <url><loc>__ORIGIN__/admin/secret</loc></url>
</urlset>`,
  },
  "/robots.txt": {
    status: 200, type: "text/plain",
    body: `User-agent: *\nDisallow: /admin\nSitemap: __ORIGIN__/sitemap.xml`,
  },
};

export async function startFixtureServer(): Promise<{ url: string; stop: () => void }> {
  const server = createServer((req, res) => {
    const pathname = new URL(req.url ?? "/", "http://localhost").pathname;
    const entry = PAGES[pathname];
    if (!entry) {
      res.writeHead(404, { "content-type": "text/plain" });
      res.end("not found");
      return;
    }
    const addr = server.address();
    const port = typeof addr === "object" && addr ? addr.port : 0;
    const origin = `http://127.0.0.1:${port}`;
    const body = entry.body.replaceAll("__ORIGIN__", origin);
    res.writeHead(entry.status, { "content-type": entry.type });
    res.end(body);
  });

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));

  const addr = server.address();
  const port = typeof addr === "object" && addr ? addr.port : 0;

  return {
    url: `http://127.0.0.1:${port}`,
    stop: () => { server.close(); },
  };
}
