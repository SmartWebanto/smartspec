import { finding } from "../finding";
import type { ParsedHtml } from "../../crawl/parse-html";
import type { Finding } from "../../legacy-types";

export type ImagesCtx = { url: string; parsed: ParsedHtml };

export async function imagesModule(ctx: ImagesCtx): Promise<Finding[]> {
  const out: Finding[] = [];
  const p = ctx.parsed;

  // Images with no `alt` attribute at all (decorative `alt=""` is excluded —
  // that's a valid, intentional pattern for screen readers).
  const missingAlt = p.images.filter((i) => i.alt === undefined);
  if (missingAlt.length > 0) {
    out.push(
      finding(
        "images-alt-missing",
        "images",
        "warning",
        `${missingAlt.length} image${missingAlt.length === 1 ? "" : "s"} missing alt attribute`,
        missingAlt.slice(0, 5).map((i) => i.src).join("\n"),
        'Add a descriptive alt attribute to each <img>. For purely decorative images use alt="" (empty) so screen readers skip them — but the attribute must be present.',
        ctx.url,
        {
          docKey: "altText",
          impact:
            "Missing alt text fails WCAG accessibility and removes one of the few text signals Google has about image content.",
          businessImpact: "ux",
          framework: "SEO",
        },
      ),
    );
  }

  const noLazy = p.images.filter((i) => i.loading !== "lazy");
  if (noLazy.length > 3) {
    out.push(
      finding(
        "images-lazy-missing",
        "images",
        "info",
        `${noLazy.length} images load eagerly`,
        "Browsers download these on initial page load even when off-screen.",
        'Add loading="lazy" to images below the fold. Keep eager loading only for the LCP / hero image.',
        ctx.url,
        {
          docKey: "lazyLoading",
          impact:
            "Eagerly loaded off-screen images delay LCP and waste mobile bandwidth.",
          businessImpact: "ux",
          framework: "SEO",
        },
      ),
    );
  }

  return out;
}
