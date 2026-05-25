import { finding } from "../finding";
import type { ParsedHtml } from "../../crawl/parse-html";
import type { Finding } from "../../legacy-types";

export type SchemaCtx = { url: string; parsed: ParsedHtml };

// Schema audit philosophy
// -----------------------
// Organization and WebSite schemas are conventionally declared once on the
// homepage and referenced by `@id` elsewhere — fanning them out across every
// page is anti-pattern, not best practice. So:
//
// - On the homepage: missing Org/WebSite is a warning (real signal loss).
// - On other pages: we don't expect Org/WebSite at all; we only check whether
//   *some* structured data is present (info-level, since many page types
//   legitimately have none).

function hasType(jsonLd: unknown[], target: string): boolean {
  return jsonLd.some((j) => {
    const t = (j as Record<string, unknown>)["@type"];
    return t === target || (Array.isArray(t) && t.includes(target));
  });
}

export async function schemaModule(ctx: SchemaCtx): Promise<Finding[]> {
  const out: Finding[] = [];
  const p = ctx.parsed;

  let isHomepage = false;
  try {
    isHomepage = new URL(ctx.url).pathname === "/";
  } catch {
    isHomepage = false;
  }

  if (isHomepage) {
    if (p.jsonLd.length === 0) {
      out.push(
        finding(
          "schema-jsonld-missing",
          "schema",
          "warning",
          "Homepage has no JSON-LD structured data",
          'No <script type="application/ld+json"> blocks found on the homepage.',
          "Add at minimum an Organization block (brand identity) and a WebSite block (sitelinks search box). Other types (Article, Product, BreadcrumbList) belong on their corresponding pages.",
          ctx.url,
          {
            docKey: "jsonLd",
            impact:
              "The homepage is where Google looks for brand entity signals. Missing schema means no Knowledge Panel candidacy and no sitelinks search box.",
            businessImpact: "ctr",
            framework: "SEO",
          },
        ),
      );
      return out;
    }

    if (!hasType(p.jsonLd, "Organization")) {
      out.push(
        finding(
          "schema-missing-organization",
          "schema",
          "warning",
          "Homepage has no Organization JSON-LD",
          'JSON-LD is present but no @type "Organization" block was found.',
          'Add an Organization block with name, url, logo, and sameAs (social profiles):\n<script type="application/ld+json">\n{"@context":"https://schema.org","@type":"Organization","name":"...","url":"...","logo":"...","sameAs":["..."]}\n</script>',
          ctx.url,
          {
            docKey: "jsonLd",
            impact:
              "Without Organization on the homepage, Google cannot reliably attribute knowledge-panel signals to the brand.",
            businessImpact: "ranking",
            framework: "SEO",
          },
        ),
      );
    }

    if (!hasType(p.jsonLd, "WebSite")) {
      out.push(
        finding(
          "schema-missing-website",
          "schema",
          "info",
          "Homepage has no WebSite JSON-LD",
          'JSON-LD is present but no @type "WebSite" block was found.',
          'Add a WebSite block with potentialAction → SearchAction to enable the sitelinks search box (when your site has internal search):\n<script type="application/ld+json">\n{"@context":"https://schema.org","@type":"WebSite","url":"...","potentialAction":{"@type":"SearchAction","target":"...{search_term_string}","query-input":"required name=search_term_string"}}\n</script>',
          ctx.url,
          {
            docKey: "jsonLd",
            impact:
              "Without WebSite + SearchAction, the sitelinks search box won't render under the brand SERP entry. Not applicable if the site has no internal search.",
            businessImpact: "ctr",
            framework: "SEO",
          },
        ),
      );
    }
    return out;
  }

  // Non-homepage: only flag total absence of structured data, at info severity
  // (many page types legitimately ship without JSON-LD). Don't moan about
  // Organization/WebSite — those belong on the homepage.
  if (p.jsonLd.length === 0) {
    out.push(
      finding(
        "schema-jsonld-missing",
        "schema",
        "info",
        "No JSON-LD structured data on this page",
        'No <script type="application/ld+json"> blocks found.',
        "Consider adding a schema relevant to this page type — Article, Product, BreadcrumbList, FAQPage, etc. Reference your sitewide Organization via @id if appropriate.",
        ctx.url,
        {
          docKey: "jsonLd",
          impact:
            "Structured data helps Google enrich the SERP entry (breadcrumbs, ratings, FAQ accordions). Not every page needs it, but most benefit.",
          businessImpact: "ctr",
          framework: "SEO",
        },
      ),
    );
  }

  return out;
}
