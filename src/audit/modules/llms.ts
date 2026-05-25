import { finding } from "../finding";
import type { ParsedHtml } from "../../crawl/parse-html";
import type { Finding } from "../../legacy-types";

export type LlmsCtx = { url: string; parsed: ParsedHtml; llmsTxt: string | null };

export async function llmsModule(ctx: LlmsCtx): Promise<Finding[]> {
  const out: Finding[] = [];
  if (!ctx.llmsTxt) {
    out.push(
      finding(
        "llms-txt-missing",
        "ai-readiness",
        "info",
        "No /llms.txt file",
        "GET /llms.txt returned 404 or could not be fetched.",
        "Optional: publish a /llms.txt at the site root summarizing your site for AI crawlers. The format is proposed at llmstxt.org and is still emerging — treat this as future-proofing, not an urgent fix.",
        `${new URL(ctx.url).origin}/llms.txt`,
        {
          docKey: "llmsTxt",
          impact:
            "llms.txt is a community proposal (llmstxt.org). No major AI provider has confirmed it as an official signal yet. Adopting it costs little and may help once tooling matures, but skipping it has no measurable downside today.",
          businessImpact: "ranking",
          framework: "AEO",
        },
      ),
    );
  }
  return out;
}
