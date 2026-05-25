import type { AuditResult } from "../crawl/crawl";
import type { Finding, Status } from "../legacy-types";
import { categoryScores } from "../score";

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function safeHref(url: string): string | null {
  const trimmed = url.trim();
  if (/^(https?:|mailto:)/i.test(trimmed)) return trimmed;
  return null;
}

const STATUSES: Status[] = ["backlog", "todo", "doing", "done"];
const STATUS_LABEL: Record<Status, string> = {
  backlog: "Backlog",
  todo: "Todo",
  doing: "Doing",
  done: "Done",
};

const STYLES = `
  *{box-sizing:border-box}
  body{font:14px/1.5 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#18181b;background:#fafafa;margin:0;padding:0}
  .wrap{max-width:1400px;margin:0 auto;padding:24px}
  header.report{display:flex;align-items:center;gap:24px;padding:20px 24px;background:#fff;border:1px solid #e4e4e7;border-radius:12px;margin-bottom:16px}
  .score{font-size:42px;font-weight:700;line-height:1;min-width:72px;text-align:center;padding:12px 14px;border-radius:10px}
  .score.good{color:#065f46;background:#ecfdf5;border:1px solid #a7f3d0}
  .score.warn{color:#92400e;background:#fffbeb;border:1px solid #fcd34d}
  .score.bad{color:#991b1b;background:#fef2f2;border:1px solid #fca5a5}
  .meta{flex:1}
  .meta h1{margin:0;font-size:17px;font-weight:600}
  .meta .sub{color:#71717a;font-size:13px;margin-top:4px}
  .stats{display:flex;gap:14px;font-size:13px;color:#3f3f46;margin-top:6px}
  .stats span strong{color:#18181b}
  .scorecard{display:flex;flex-wrap:wrap;gap:8px;padding:14px 16px;background:#fff;border:1px solid #e4e4e7;border-radius:12px;margin-bottom:16px}
  .tile{display:flex;flex-direction:column;align-items:center;justify-content:center;min-width:84px;padding:8px 12px;border-radius:8px;border:1px solid #e4e4e7}
  .tile.good{background:#ecfdf5;border-color:#a7f3d0;color:#065f46}
  .tile.warn{background:#fffbeb;border-color:#fcd34d;color:#92400e}
  .tile.bad{background:#fef2f2;border-color:#fca5a5;color:#991b1b}
  .tile .n{font-size:18px;font-weight:700;line-height:1}
  .tile .l{font-size:11px;font-weight:500;text-transform:uppercase;letter-spacing:.04em;margin-top:5px}
  .board{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
  .col{background:#f4f4f5;border-radius:10px;padding:12px;min-height:120px;display:flex;flex-direction:column;gap:8px}
  .col h2{margin:0 0 4px 0;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:#52525b;display:flex;align-items:center;justify-content:space-between}
  .col h2 .count{background:#e4e4e7;color:#3f3f46;font-size:11px;font-weight:600;padding:1px 8px;border-radius:9999px}
  .finding{background:#fff;border:1px solid #e4e4e7;border-radius:8px;padding:0;overflow:hidden}
  .finding>summary{list-style:none;cursor:pointer;padding:10px 12px;display:flex;flex-direction:column;gap:6px}
  .finding>summary::-webkit-details-marker{display:none}
  .finding>summary::marker{display:none}
  .finding>summary:hover{background:#fafafa}
  .finding .row{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
  .finding .title{font-size:13px;font-weight:600;line-height:1.35;color:#18181b}
  .finding[open]>summary{border-bottom:1px solid #f4f4f5}
  .badge{display:inline-block;padding:1px 7px;border-radius:9999px;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.04em}
  .badge.critical{background:#fee2e2;color:#991b1b}
  .badge.warning{background:#fef3c7;color:#92400e}
  .badge.info{background:#dbeafe;color:#1e40af}
  .badge.pass{background:#d1fae5;color:#065f46}
  .badge.cat{background:#f4f4f5;color:#52525b;font-weight:500}
  .finding .body{padding:10px 12px 12px;font-size:12px;border-top:0}
  .finding h4{margin:8px 0 4px 0;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.04em;color:#52525b}
  .finding h4:first-child{margin-top:0}
  .finding p{margin:0 0 4px 0;color:#27272a;font-size:12px}
  .finding pre{margin:0;padding:8px;background:#fafafa;border:1px solid #e4e4e7;border-radius:6px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;white-space:pre-wrap;color:#27272a;overflow:auto;max-height:180px}
  .finding ul.refs{list-style:none;padding:0;margin:4px 0 0 0}
  .finding ul.refs li{font-size:11px;padding:2px 0;word-break:break-all}
  .finding ul.refs a{color:#0369a1;text-decoration:underline}
  .col .empty{font-size:12px;color:#a1a1aa;font-style:italic;padding:8px 4px}
  footer.report{color:#a1a1aa;font-size:12px;text-align:center;padding:20px 0}
  @media (max-width:1100px){.board{grid-template-columns:repeat(2,1fr)}}
  @media (max-width:680px){.board{grid-template-columns:1fr}}
`;

function toneClass(score: number): "good" | "warn" | "bad" {
  if (score >= 80) return "good";
  if (score >= 50) return "warn";
  return "bad";
}

function severityRank(s: Finding["severity"]): number {
  return s === "critical" ? 0 : s === "warning" ? 1 : s === "info" ? 2 : 3;
}

function isoToDisplayDate(iso: string): string {
  return iso.slice(0, 10);
}

function renderHeader(
  score: number,
  domain: string,
  date: string,
  counts: { critical: number; warning: number; info: number },
): string {
  return `<header class="report">
    <div class="score ${toneClass(score)}">${score}</div>
    <div class="meta">
      <h1>smartspec audit · ${escapeHtml(domain)} · ${escapeHtml(date)}</h1>
      <div class="sub">Drag-and-drop kanban not available in static report — use the dashboard to manage status.</div>
      <div class="stats">
        <span><strong>${counts.critical}</strong> critical</span>
        <span><strong>${counts.warning}</strong> warning</span>
        <span><strong>${counts.info}</strong> info</span>
      </div>
    </div>
  </header>`;
}

function renderScorecard(scores: Record<string, number>): string {
  const entries = Object.entries(scores).sort((a, b) => a[1] - b[1]);
  if (entries.length === 0) return "";
  const tiles = entries
    .map(
      ([name, score]) =>
        `<div class="tile ${toneClass(score)}"><span class="n">${score}</span><span class="l">${escapeHtml(name)}</span></div>`,
    )
    .join("");
  return `<div class="scorecard">${tiles}</div>`;
}

function renderRefs(refs: string[] | undefined): string {
  if (!refs || refs.length === 0) return "";
  const items = refs
    .map((r) => {
      const safe = safeHref(r);
      const text = escapeHtml(r);
      return safe ? `<li><a href="${escapeHtml(safe)}">${text}</a></li>` : `<li>${text}</li>`;
    })
    .join("");
  return `<h4>Affected URL(s) (${refs.length})</h4><ul class="refs">${items}</ul>`;
}

function renderFindingCard(f: Finding): string {
  return `<details class="finding">
    <summary>
      <div class="row">
        <span class="badge ${f.severity}">${f.severity}</span>
        <span class="badge cat">${escapeHtml(f.category)}</span>
      </div>
      <span class="title">${escapeHtml(f.title)}</span>
    </summary>
    <div class="body">
      <h4>Issue</h4>
      <pre>${escapeHtml(f.evidence)}</pre>
      ${f.impact ? `<h4>Why it matters</h4><p>${escapeHtml(f.impact)}</p>` : ""}
      <h4>How to fix</h4>
      <p>${escapeHtml(f.recommendation)}</p>
      ${renderRefs(f.refs)}
    </div>
  </details>`;
}

function renderColumn(status: Status, findings: Finding[]): string {
  const sorted = [...findings].sort(
    (a, b) => severityRank(a.severity) - severityRank(b.severity),
  );
  const cards = sorted.length
    ? sorted.map(renderFindingCard).join("")
    : `<div class="empty">No findings</div>`;
  return `<section class="col" data-status="${status}">
    <h2>${STATUS_LABEL[status]}<span class="count">${findings.length}</span></h2>
    ${cards}
  </section>`;
}

export function renderHtmlReport(result: AuditResult): string {
  const all = result.findings;
  const open = all.filter((f) => f.status !== "done");
  const counts = {
    critical: open.filter((f) => f.severity === "critical").length,
    warning: open.filter((f) => f.severity === "warning").length,
    info: open.filter((f) => f.severity === "info").length,
  };
  let domain = result.finalUrl;
  try {
    domain = new URL(result.finalUrl).hostname;
  } catch {
    /* keep raw URL */
  }
  const date = isoToDisplayDate(result.finishedAt);
  const scores = categoryScores(open);

  const byStatus: Record<Status, Finding[]> = { backlog: [], todo: [], doing: [], done: [] };
  for (const f of all) byStatus[f.status].push(f);

  const columns = STATUSES.map((s) => renderColumn(s, byStatus[s])).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>smartspec audit · ${escapeHtml(domain)} · ${escapeHtml(date)}</title>
<style>${STYLES}</style>
</head>
<body>
<div class="wrap">
${renderHeader(result.score, domain, date, counts)}
${renderScorecard(scores)}
<div class="board">${columns}</div>
<footer class="report">Generated by smartspec — ${escapeHtml(date)}</footer>
</div>
</body>
</html>`;
}
