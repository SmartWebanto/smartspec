import { finding } from "../finding";
import type { ParsedHtml } from "../../crawl/parse-html";
import type { Finding } from "../../legacy-types";

export type SchemaCtx = { url: string; parsed: ParsedHtml };

export async function schemaModule(ctx: SchemaCtx): Promise<Finding[]> {
  const out: Finding[] = [];
  const p = ctx.parsed;

  let isHomepage = false;
  try {
    isHomepage = new URL(ctx.url).pathname === "/";
  } catch {
    isHomepage = false;
  }

  if (isHomepage && p.jsonLd.length > 0) {
    const hasOrg = p.jsonLd.some((j) => {
      const t = (j as Record<string, unknown>)["@type"];
      return t === "Organization" || (Array.isArray(t) && t.includes("Organization"));
    });
    if (!hasOrg) {
      out.push(
        finding(
          "schema-missing-organization",
          "schema",
          "warning",
          "Homepage has no Organization JSON-LD",
          'No <script type="application/ld+json"> with @type Organization found.',
          'Add an Organization schema in <head>:\n<script type="application/ld+json">\n{"@context":"https://schema.org","@type":"Organization","name":"<your name>","url":"<your url>","logo":"<your logo url>"}\n</script>',
          ctx.url,
          {
            docKey: "jsonLd",
            impact:
              "Without Organization schema, Google cannot build a Knowledge Panel for the brand. AI tools never add this by default.",
            businessImpact: "ranking",
            framework: "SEO",
          },
        ),
      );
    }

    const hasWebsite = p.jsonLd.some((j) => {
      const t = (j as Record<string, unknown>)["@type"];
      return t === "WebSite" || (Array.isArray(t) && t.includes("WebSite"));
    });
    if (!hasWebsite) {
      out.push(
        finding(
          "schema-missing-website",
          "schema",
          "warning",
          "Homepage has no WebSite JSON-LD",
          'No <script type="application/ld+json"> with @type WebSite found.',
          'Add a WebSite schema in <head>:\n<script type="application/ld+json">\n{"@context":"https://schema.org","@type":"WebSite","name":"<site name>","url":"<site url>","potentialAction":{"@type":"SearchAction","target":"<search url template>","query-input":"required name=search_term_string"}}\n</script>',
          ctx.url,
          {
            docKey: "jsonLd",
            impact:
              "WebSite schema enables sitelinks search box and clarifies site identity. AI tools omit it.",
            businessImpact: "ctr",
            framework: "SEO",
          },
        ),
      );
    }
  }

  if (p.jsonLd.length === 0) {
    out.push(
      finding(
        "schema-jsonld-missing",
        "schema",
        "warning",
        "No JSON-LD structured data",
        'No <script type="application/ld+json"> blocks found.',
        "Add JSON-LD for the most relevant types: Organization on the homepage, WebSite + SearchAction sitewide, Article/Product on specific pages.",
        ctx.url,
        {
          docKey: "jsonLd",
          impact:
            "Without structured data Google cannot enrich your SERP entry with sitelinks, ratings, breadcrumbs, or knowledge panel signals.",
          businessImpact: "ctr",
          framework: "SEO",
        },
      ),
    );
    return out;
  }

  const types = new Set<string>();
  for (const node of p.jsonLd) {
    const t = (node as { "@type"?: string | string[] })["@type"];
    if (typeof t === "string") types.add(t);
    else if (Array.isArray(t)) t.forEach((x) => types.add(x));
  }

  if (!isHomepage) {
    if (!types.has("Organization")) {
      out.push(
        finding(
          "schema-org-missing",
          "schema",
          "warning",
          "No Organization schema",
          "JSON-LD blocks found but none of type Organization.",
          "Add an Organization schema with name, url, logo, and sameAs (social profiles).",
          ctx.url,
          {
            docKey: "organization",
            impact:
              "Organization schema feeds Google's Knowledge Panel and brand recognition signals.",
            businessImpact: "ranking",
            framework: "SEO",
          },
        ),
      );
    }

    if (!types.has("WebSite")) {
      out.push(
        finding(
          "schema-website-missing",
          "schema",
          "info",
          "No WebSite schema",
          "WebSite schema with potentialAction enables the Sitelinks Search Box.",
          "Add a WebSite JSON-LD block with potentialAction → SearchAction pointing to your internal search URL.",
          ctx.url,
          {
            docKey: "website",
            impact:
              "Without WebSite + SearchAction, the Sitelinks Search Box won't appear under your brand SERP entry.",
            businessImpact: "ctr",
            framework: "SEO",
          },
        ),
      );
    }
  }

  return out;
}
