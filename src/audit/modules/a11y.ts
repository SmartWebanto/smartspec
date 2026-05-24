import { finding } from "../finding";
import type { ParsedHtml } from "../../crawl/parse-html";
import type { Finding } from "../../legacy-types";

export type A11yCtx = { url: string; parsed: ParsedHtml };

export async function a11yModule(ctx: A11yCtx): Promise<Finding[]> {
  const out: Finding[] = [];
  const h = ctx.parsed.headings;
  if (h.length === 0) return out;

  const h1Count = h.filter((x) => x.level === 1).length;
  if (h1Count === 0) {
    out.push(
      finding(
        "a11y-no-h1",
        "a11y",
        "warning",
        "Page has no <h1>",
        "No level-1 heading detected.",
        "Add exactly one <h1> per page — the primary topic heading.",
        ctx.url,
        {
          docKey: "headingHierarchy",
          impact:
            "Screen readers and search engines use the H1 as the page's primary topic signal.",
          businessImpact: "ranking",
          framework: "SEO",
        },
      ),
    );
  }
  if (h1Count > 1) {
    out.push(
      finding(
        "a11y-multiple-h1",
        "a11y",
        "info",
        `Page has ${h1Count} <h1> tags`,
        "Multiple H1s found.",
        "Use exactly one H1; demote the rest to H2.",
        ctx.url,
        {
          docKey: "headingHierarchy",
          impact: "Multiple H1s weaken the primary-topic signal.",
          businessImpact: "ranking",
          framework: "SEO",
        },
      ),
    );
  }

  for (let i = 1; i < h.length; i++) {
    if (h[i].level > h[i - 1].level + 1) {
      out.push(
        finding(
          "a11y-heading-skip",
          "a11y",
          "info",
          `Heading hierarchy skips from h${h[i - 1].level} to h${h[i].level}`,
          `${h[i - 1].text} → ${h[i].text}`,
          "Use heading levels sequentially (h1 → h2 → h3) so screen readers can navigate the document outline.",
          ctx.url,
          {
            docKey: "headingHierarchy",
            impact:
              "Broken heading hierarchy breaks assistive-tech navigation and weakens content structure signals.",
            businessImpact: "ux",
            framework: "SEO",
          },
        ),
      );
      break;
    }
  }

  return out;
}
