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
        "Create a /llms.txt at the site root that summarizes your site for LLM crawlers (ChatGPT, Claude, Perplexity). See the spec at llmstxt.org.",
        `${new URL(ctx.url).origin}/llms.txt`,
        {
          docKey: "llmsTxt",
          impact:
            "AI search engines (ChatGPT, Perplexity, Claude) use llms.txt to understand and cite your site. Without it your brand is less likely to appear in AI answers.",
          businessImpact: "ranking",
          framework: "AEO",
        },
      ),
    );
  }
  return out;
}
