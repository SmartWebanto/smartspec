import { fetchHtml, fetchText } from "../crawl/fetch";
import { parseHtml } from "../crawl/parse-html";
import { runPageSpeed } from "./pagespeed";
import { healthScore } from "../score";
import { pageModule } from "./modules/page";
import { schemaModule } from "./modules/schema";
import { imagesModule } from "./modules/images";
import { linksModule } from "./modules/links";
import { llmsModule } from "./modules/llms";
import { robotsModule } from "./modules/robots";
import { redirectsModule } from "./modules/redirects";
import { sitemapModule } from "./modules/sitemap";
import { hreflangModule } from "./modules/hreflang";
import { socialModule } from "./modules/social";
import { a11yModule } from "./modules/a11y";
import { securityModule } from "./modules/security";
import { performanceModule } from "./modules/performance";
import { mobileModule } from "./modules/mobile";
import { contentQualityModule } from "./modules/content-quality";
import { analyticsModule } from "./modules/analytics";
import { decorateFindingsWithAiTool } from "./decorate-fixes";
import type { Finding } from "../legacy-types";

export type AuditResult = {
  url: string;
  finalUrl: string;
  startedAt: string;
  finishedAt: string;
  score: number;
  findings: Finding[];
};

export async function runAudit(originalUrl: string): Promise<AuditResult> {
  const startedAt = new Date().toISOString();
  const main = await fetchHtml(originalUrl);
  const parsed = parseHtml(main.body, main.finalUrl);
  const origin = new URL(main.finalUrl).origin;

  const [robotsR, sitemapR, llmsR, psi] = await Promise.all([
    fetchText(`${origin}/robots.txt`),
    fetchText(`${origin}/sitemap.xml`),
    fetchText(`${origin}/llms.txt`),
    runPageSpeed(main.finalUrl, "mobile", process.env.GOOGLE_PSI_API_KEY),
  ]);
  const robotsTxt = robotsR && robotsR.status === 200 ? robotsR.body : null;
  const sitemapXml = sitemapR && sitemapR.status === 200 ? sitemapR.body : null;
  const llmsTxt = llmsR && llmsR.status === 200 ? llmsR.body : null;

  const ctxBase = { url: main.finalUrl, parsed };
  const rawFindings: Finding[] = (
    await Promise.all([
      pageModule(ctxBase),
      schemaModule(ctxBase),
      imagesModule(ctxBase),
      linksModule(ctxBase),
      llmsModule({ ...ctxBase, llmsTxt }),
      robotsModule({ ...ctxBase, robotsTxt }),
      redirectsModule({ ...ctxBase, originalUrl, finalUrl: main.finalUrl }),
      sitemapModule({ ...ctxBase, sitemapXml }),
      hreflangModule(ctxBase),
      socialModule(ctxBase),
      a11yModule(ctxBase),
      mobileModule(ctxBase),
      contentQualityModule(ctxBase),
      analyticsModule(ctxBase),
      securityModule({ ...ctxBase, headers: main.headers }),
      psi ? performanceModule({ ...ctxBase, psi }) : Promise.resolve([]),
    ])
  ).flat();

  const findings = decorateFindingsWithAiTool(rawFindings, main.finalUrl, main.body);

  return {
    url: originalUrl,
    finalUrl: main.finalUrl,
    startedAt,
    finishedAt: new Date().toISOString(),
    score: healthScore(findings),
    findings,
  };
}
