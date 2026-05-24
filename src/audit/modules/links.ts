import { finding } from "../finding";
import type { ParsedHtml } from "../../crawl/parse-html";
import type { Finding } from "../../legacy-types";

export type LinksCtx = { url: string; parsed: ParsedHtml };

export async function linksModule(ctx: LinksCtx): Promise<Finding[]> {
  const out: Finding[] = [];
  const internal = ctx.parsed.links.internal;

  if (internal.length < 3) {
    out.push(
      finding(
        "links-internal-sparse",
        "links",
        "warning",
        `Only ${internal.length} internal link${internal.length === 1 ? "" : "s"} on the page`,
        "Few or no internal anchors detected.",
        "Add contextual internal links to related pages — typical content pages have 10-30 internal links.",
        ctx.url,
        {
          docKey: "anchorText",
          impact: "Internal links spread PageRank and help Google discover related pages.",
          businessImpact: "ranking",
          framework: "SEO",
        },
      ),
    );
  }

  const empty = internal.filter((l) => l.text.trim() === "");
  if (empty.length > 0) {
    out.push(
      finding(
        "links-empty-anchor",
        "links",
        "warning",
        `${empty.length} internal link${empty.length === 1 ? "" : "s"} have empty anchor text`,
        empty.slice(0, 5).map((l) => l.href).join("\n"),
        "Replace empty anchors with descriptive text. If the link wraps an image, ensure the image has a meaningful alt attribute.",
        ctx.url,
        {
          docKey: "anchorText",
          impact: "Empty anchors give Google zero context about the linked page topic.",
          businessImpact: "ranking",
          framework: "SEO",
        },
      ),
    );
  }

  return out;
}
