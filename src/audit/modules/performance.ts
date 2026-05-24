import { finding } from "../finding";
import type { ParsedHtml } from "../../crawl/parse-html";
import type { PageSpeedResult } from "../pagespeed";
import type { Finding } from "../../legacy-types";

export type PerformanceCtx = { url: string; parsed: ParsedHtml; psi: PageSpeedResult };

export async function performanceModule(ctx: PerformanceCtx): Promise<Finding[]> {
  const out: Finding[] = [];
  const { lcpMs, cls, inpMs, performance } = ctx.psi;

  if (lcpMs !== null && lcpMs > 2500) {
    out.push(
      finding(
        "performance-lcp-slow",
        "performance",
        "warning",
        `LCP is ${(lcpMs / 1000).toFixed(1)}s (target: <2.5s)`,
        `PSI mobile LCP = ${lcpMs} ms.`,
        "Optimise the hero image (modern format, dimensions, preload), reduce render-blocking CSS/JS, and serve over HTTP/2.",
        ctx.url,
        {
          docKey: "lcp",
          impact: "LCP is a Core Web Vital. Slow LCP hurts both ranking and bounce rate.",
          businessImpact: "ux",
          framework: "SEO",
        },
      ),
    );
  }

  if (cls !== null && cls > 0.1) {
    out.push(
      finding(
        "performance-cls-high",
        "performance",
        "warning",
        `CLS is ${cls.toFixed(2)} (target: <0.1)`,
        `PSI mobile CLS = ${cls}.`,
        "Set explicit width/height on images and embeds; reserve space for ads and late-loading content; avoid inserting DOM above existing content.",
        ctx.url,
        {
          docKey: "cls",
          impact:
            "Layout shifts frustrate users who tap the wrong target and hurt engagement metrics.",
          businessImpact: "ux",
          framework: "SEO",
        },
      ),
    );
  }

  if (inpMs !== null && inpMs > 200) {
    out.push(
      finding(
        "performance-inp-slow",
        "performance",
        "warning",
        `INP is ${inpMs}ms (target: <200ms)`,
        `PSI mobile INP = ${inpMs} ms.`,
        "Reduce JavaScript execution time on interactions; break long tasks; defer non-critical scripts.",
        ctx.url,
        {
          docKey: "inp",
          impact: "Slow interactions feel broken — users abandon before conversion.",
          businessImpact: "ux",
          framework: "SEO",
        },
      ),
    );
  }

  if (performance !== null && performance < 50) {
    out.push(
      finding(
        "performance-score-poor",
        "performance",
        "critical",
        `Performance score is ${performance}/100`,
        "PageSpeed Insights gave a failing mobile performance grade.",
        "Address the LCP/CLS/INP findings above and run PSI again until score is above 50 (>90 ideal).",
        ctx.url,
        {
          docKey: "cwv",
          impact:
            "Failing PSI suggests Core Web Vitals are not met sitewide, dragging ranking signals.",
          businessImpact: "ux",
          framework: "SEO",
        },
      ),
    );
  }

  return out;
}
