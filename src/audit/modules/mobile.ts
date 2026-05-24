import { finding } from "../finding";
import type { ParsedHtml } from "../../crawl/parse-html";
import type { Finding } from "../../legacy-types";

export type MobileCtx = { url: string; parsed: ParsedHtml };

export async function mobileModule(ctx: MobileCtx): Promise<Finding[]> {
  const out: Finding[] = [];
  if (!ctx.parsed.viewport) {
    out.push(
      finding(
        "mobile-viewport-missing",
        "mobile",
        "critical",
        "No viewport meta tag",
        "Mobile rendering is not configured. Common in v0 / Vite / CRA defaults.",
        'Add <meta name="viewport" content="width=device-width, initial-scale=1"> inside <head>.',
        ctx.url,
        {
          docKey: "viewport",
          impact:
            "Mobile browsers render at desktop width and zoom out, breaking layout and tap targets. Google's mobile-first index penalizes this.",
          businessImpact: "ux",
          framework: "SEO",
        },
      ),
    );
  }
  return out;
}
