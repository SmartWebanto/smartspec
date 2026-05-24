import { finding } from "../finding";
import type { ParsedHtml } from "../../crawl/parse-html";
import type { Finding } from "../../legacy-types";

export type SocialCtx = { url: string; parsed: ParsedHtml };

export async function socialModule(ctx: SocialCtx): Promise<Finding[]> {
  const out: Finding[] = [];
  const og = ctx.parsed.og;

  const missing = ["og:title", "og:description", "og:image", "og:url"].filter((k) => !og[k]);
  if (missing.length > 0) {
    out.push(
      finding(
        "social-og-incomplete",
        "social",
        "info",
        `Open Graph missing ${missing.length} of 4 core tags`,
        `Missing: ${missing.join(", ")}`,
        "Add og:title, og:description, og:image, og:url so previews on Facebook, LinkedIn, Slack, Discord and iMessage render correctly.",
        ctx.url,
        {
          docKey: "ogProtocol",
          impact:
            "Bare URL previews on social platforms — fewer clicks from shared links.",
          businessImpact: "ctr",
          framework: "SEO",
        },
      ),
    );
  }

  if (!ctx.parsed.twitter["twitter:card"]) {
    out.push(
      finding(
        "social-twitter-card-missing",
        "social",
        "info",
        "No Twitter Card meta",
        "twitter:card not declared.",
        'Add <meta name="twitter:card" content="summary_large_image"> so X (Twitter) previews render with a large image.',
        ctx.url,
        {
          docKey: "twitterCards",
          impact: "Reduced engagement on X — link previews collapse to a plain URL.",
          businessImpact: "ctr",
          framework: "SEO",
        },
      ),
    );
  }

  return out;
}
