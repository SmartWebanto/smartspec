import { finding } from "../finding";
import type { ParsedHtml } from "../../crawl/parse-html";
import type { Finding } from "../../legacy-types";

export type SecurityCtx = {
  url: string;
  parsed: ParsedHtml;
  headers: Record<string, string>;
};

export async function securityModule(ctx: SecurityCtx): Promise<Finding[]> {
  const out: Finding[] = [];
  const h = ctx.headers;

  if (!h["strict-transport-security"]) {
    out.push(
      finding(
        "security-hsts-missing",
        "security",
        "warning",
        "No Strict-Transport-Security header",
        "HSTS header not sent by the server.",
        "Add Strict-Transport-Security: max-age=31536000; includeSubDomains to force HTTPS on all subsequent requests.",
        ctx.url,
        {
          docKey: "hsts",
          impact:
            "Users on flaky networks can still be downgraded to HTTP, exposing them to man-in-the-middle attacks.",
          businessImpact: "security",
          framework: "SEO",
        },
      ),
    );
  }

  if (!h["content-security-policy"]) {
    out.push(
      finding(
        "security-csp-missing",
        "security",
        "info",
        "No Content-Security-Policy header",
        "CSP header not sent.",
        "Add a Content-Security-Policy that whitelists only the script/style/img origins you actually use.",
        ctx.url,
        {
          docKey: "csp",
          impact:
            "Without CSP a single XSS injection can execute arbitrary scripts in users' browsers.",
          businessImpact: "security",
          framework: "SEO",
        },
      ),
    );
  }

  if (
    !h["x-frame-options"] &&
    !h["content-security-policy"]?.includes("frame-ancestors")
  ) {
    out.push(
      finding(
        "security-xframe-missing",
        "security",
        "info",
        "No X-Frame-Options or CSP frame-ancestors",
        "Page can be embedded in <iframe> on any site.",
        "Add X-Frame-Options: DENY (or SAMEORIGIN) to prevent clickjacking.",
        ctx.url,
        {
          docKey: "xFrame",
          impact:
            "Allows clickjacking attacks where your site is overlaid invisibly under malicious UI.",
          businessImpact: "security",
          framework: "SEO",
        },
      ),
    );
  }

  if (!h["referrer-policy"]) {
    out.push(
      finding(
        "security-referrer-policy-missing",
        "security",
        "info",
        "No Referrer-Policy header",
        "Referrer-Policy not declared.",
        "Add Referrer-Policy: strict-origin-when-cross-origin to limit referer leakage.",
        ctx.url,
        {
          docKey: "referrerPolicy",
          impact:
            "Full URLs (including query strings) can leak to third-party sites users follow links to.",
          businessImpact: "security",
          framework: "SEO",
        },
      ),
    );
  }

  return out;
}
