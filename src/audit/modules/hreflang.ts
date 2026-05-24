import { finding } from "../finding";
import type { ParsedHtml } from "../../crawl/parse-html";
import type { Finding } from "../../legacy-types";

export type HreflangCtx = { url: string; parsed: ParsedHtml };

export async function hreflangModule(ctx: HreflangCtx): Promise<Finding[]> {
  const out: Finding[] = [];
  const tags = ctx.parsed.hreflang;
  if (tags.length === 0) return out;

  let canonical: string;
  try {
    canonical = new URL(ctx.url).toString();
  } catch {
    return out;
  }

  const hasSelf = tags.some((t) => {
    try {
      return new URL(t.href).toString() === canonical;
    } catch {
      return false;
    }
  });

  if (!hasSelf) {
    out.push(
      finding(
        "hreflang-no-self",
        "hreflang",
        "warning",
        "hreflang cluster missing self-referencing tag",
        `Current URL ${ctx.url} is not listed among the hreflang alternates.`,
        "Add an hreflang alternate pointing to the current page itself (Google requires self-referencing tags in every cluster).",
        ctx.url,
        {
          docKey: "hreflang",
          impact:
            "Google may ignore the entire hreflang cluster if self-referencing tag is missing.",
          businessImpact: "ranking",
          framework: "SEO",
        },
      ),
    );
  }

  return out;
}
