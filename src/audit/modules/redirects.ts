import { finding } from "../finding";
import type { ParsedHtml } from "../../crawl/parse-html";
import type { Finding } from "../../legacy-types";

export type RedirectsCtx = {
  url: string;
  parsed: ParsedHtml;
  originalUrl: string;
  finalUrl: string;
};

export async function redirectsModule(ctx: RedirectsCtx): Promise<Finding[]> {
  const out: Finding[] = [];
  let orig: URL;
  let fin: URL;
  try {
    orig = new URL(ctx.originalUrl);
    fin = new URL(ctx.finalUrl);
  } catch {
    return out;
  }

  if (orig.protocol === "http:" && fin.protocol === "https:") {
    out.push(
      finding(
        "redirects-http-upgrade",
        "redirects",
        "info",
        "Site upgrades HTTP to HTTPS via redirect",
        `${ctx.originalUrl} → ${ctx.finalUrl}`,
        "Make sure all internal links use https:// directly to avoid redirect hops on every entry.",
        ctx.url,
        {
          impact: "Each redirect adds 50-200ms to page load and burns crawl budget.",
          businessImpact: "ux",
          framework: "SEO",
        },
      ),
    );
  }

  return out;
}
