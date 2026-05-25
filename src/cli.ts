// CLI entry point. Compiled to dist/smartspec via `bun build --compile`.

export type Command = "audit" | "doctor" | "version" | "help";

export type ParsedArgs = {
  command: Command;
  target?: string;
  flags: {
    format: "console" | "json" | "html" | "markdown" | "text" | "llm" | "xml";
    output?: string;
    maxPages: number;
    categories?: string[];
    quiet: boolean;
    verbose: boolean;
    noFixes: boolean;
    noPlugins: boolean;
  };
};

const DEFAULT_FLAGS: ParsedArgs["flags"] = {
  format: "console",
  maxPages: 250,
  quiet: false,
  verbose: false,
  noFixes: false,
  noPlugins: false,
};

export function parseArgs(argv: string[]): ParsedArgs {
  if (argv.length === 0) return { command: "help", flags: { ...DEFAULT_FLAGS } };

  const [cmd, ...rest] = argv;
  if (cmd !== "audit" && cmd !== "doctor" && cmd !== "version") {
    return { command: "help", flags: { ...DEFAULT_FLAGS } };
  }

  const flags = { ...DEFAULT_FLAGS };
  let target: string | undefined;
  let i = 0;

  if (cmd === "audit" && rest.length > 0 && !rest[0].startsWith("-")) {
    target = rest[0];
    i = 1;
  }

  while (i < rest.length) {
    const arg = rest[i];
    switch (arg) {
      case "-f":
      case "--format":
        if (i + 1 < rest.length) flags.format = rest[++i] as ParsedArgs["flags"]["format"];
        break;
      case "-o":
      case "--output":
        if (i + 1 < rest.length) flags.output = rest[++i];
        break;
      case "-m":
      case "--max-pages":
        if (i + 1 < rest.length) flags.maxPages = parseInt(rest[++i], 10);
        break;
      case "--categories":
        if (i + 1 < rest.length) flags.categories = rest[++i].split(",").map(s => s.trim()).filter(Boolean);
        break;
      case "-q":
      case "--quiet":
        flags.quiet = true;
        break;
      case "--verbose":
        flags.verbose = true;
        break;
      case "--no-fixes":
        flags.noFixes = true;
        break;
      case "--no-plugins":
        flags.noPlugins = true;
        break;
    }
    i++;
  }

  return { command: cmd as Command, target, flags };
}

import { crawlAudit } from "./crawl/crawl";
import { readEnvConfig } from "./crawl/env";
import { renderHtmlReport } from "./formatters/html";
import { renderMarkdownReport } from "./formatters/markdown";
import { renderTextReport } from "./formatters/text";
import { renderXmlReport } from "./formatters/xml";
import { renderLlmReport } from "./formatters/llm";
import {
  ALL_AUDIT_CATEGORIES,
  AUDIT_CATEGORY_ALIASES,
  invalidAuditCategories,
  normalizeAuditCategories,
} from "./audit/aggregate-passes";

export async function runAuditCommand(
  target: string | undefined,
  flags: ParsedArgs["flags"],
  stdout: NodeJS.WriteStream = process.stdout,
  stderr: NodeJS.WriteStream = process.stderr,
): Promise<number> {
  const ac = new AbortController();
  const onSigint = () => {
    stderr.write("\nreceived SIGINT, aborting run...\n");
    ac.abort();
  };
  process.on("SIGINT", onSigint);

  if (!target) {
    process.off("SIGINT", onSigint);
    stderr.write("error: audit requires a URL or slug\n");
    stderr.write("usage: smartspec audit <url-or-slug> [flags]\n");
    return 1;
  }

  const invalidCategories = invalidAuditCategories(flags.categories);
  if (invalidCategories.length > 0) {
    process.off("SIGINT", onSigint);
    stderr.write(`error: unknown audit categor${invalidCategories.length === 1 ? "y" : "ies"}: ${invalidCategories.join(", ")}\n`);
    stderr.write(`allowed categories: ${formatAllowedCategories()}\n`);
    return 1;
  }

  if (!flags.quiet) stderr.write(`auditing ${target}...\n`);

  const envCfg = readEnvConfig(process.env);
  let result;
  try {
    result = await crawlAudit(target, {
      maxPages: flags.maxPages,
      signal: ac.signal,
      concurrency: envCfg.concurrency,
      userAgent: envCfg.userAgent,
      requestsPerSecond: envCfg.requestsPerSecond,
      categories: normalizeAuditCategories(flags.categories),
      includeFixes: !flags.noFixes,
    });
  } catch (e) {
    if (ac.signal.aborted) {
      stderr.write("run aborted; no output emitted\n");
      return 130;
    }
    stderr.write(`error: ${(e as Error).message}\n`);
    return 1;
  } finally {
    process.off("SIGINT", onSigint);
  }

  let body: string;
  switch (flags.format) {
    case "html":
      body = renderHtmlReport(result);
      break;
    case "markdown":
      body = renderMarkdownReport(result);
      break;
    case "text":
      body = renderTextReport(result);
      break;
    case "xml":
      body = renderXmlReport(result);
      break;
    case "llm":
      body = renderLlmReport(result);
      break;
    case "json":
      body = JSON.stringify(result, null, 2);
      break;
    case "console":
    default:
      body = `score: ${result.score}\nfindings: ${result.findings.length}\n`;
      break;
  }

  if (flags.output) {
    const { writeFile } = await import("node:fs/promises");
    await writeFile(flags.output, body.endsWith("\n") ? body : body + "\n", "utf8");
    if (!flags.quiet) stderr.write(`wrote ${flags.output}\n`);
  } else {
    stdout.write(body.endsWith("\n") ? body : body + "\n");
  }
  return 0;
}

export async function runDoctorCommand(stdout: NodeJS.WriteStream = process.stdout): Promise<number> {
  stdout.write("network: checking https://example.com ... ");
  try {
    const r = await fetch("https://example.com", { signal: AbortSignal.timeout(5000) });
    stdout.write(`OK (${r.status})\n`);
  } catch (e) {
    stdout.write(`FAIL (${(e as Error).message})\n`);
  }

  stdout.write(`python: ${await detectPython()}\n`);
  stdout.write(`plugins: 0 found (plugins added in Phase 6)\n`);
  return 0;
}

async function detectPython(): Promise<string> {
  const { execFile } = await import("node:child_process");
  return new Promise((resolve) => {
    execFile("python3", ["--version"], { timeout: 3000 }, (err, stdout, stderr) => {
      if (err) {
        resolve("not found");
        return;
      }
      const out = (stdout || stderr || "").trim();
      resolve(out || "found");
    });
  });
}

export function runVersionCommand(stdout: NodeJS.WriteStream = process.stdout): number {
  const version = (process.env.SMARTSPEC_VERSION as string) || "0.0.0-dev";
  const commit = (process.env.SMARTSPEC_COMMIT as string) || "unknown";
  stdout.write(`smartspec ${version} (${commit})\n`);
  return 0;
}

export function printHelp(stdout: NodeJS.WriteStream = process.stdout): number {
  stdout.write(`usage: smartspec <command> [args]

commands:
  audit <url-or-slug>   Run a technical SEO audit
  doctor                Sanity-check environment
  version               Print version info
  help                  Show this help

flags (audit):
  -f, --format <t>      console|json|html|markdown|text|llm|xml (default: console)
  -o, --output <path>   Write rendered output to file instead of stdout
  -m, --max-pages <n>   Crawl limit (default: 250)
  --categories <list>   Comma-separated subset (e.g. page,a11y,schema)
  --no-fixes            Skip suggested_fix emission
  --no-plugins          Skip Python plugins
  -q, --quiet           Suppress progress
  --verbose             Verbose logs to stderr

format details:
  console   minimal one-liner (score + finding count)
  json      pretty-printed AuditResult
  html      standalone HTML report (default styling embedded)
  markdown  Markdown report with summary table + per-finding sections
  text      plain text report (no markup)
  llm       Anthropic-style XML tags with a leading instruction block
  xml       standard XML for tooling integration
`);
  return 0;
}

function formatAllowedCategories(): string {
  const aliases = Object.entries(AUDIT_CATEGORY_ALIASES)
    .map(([alias, category]) => `${alias}->${category}`)
    .join(", ");
  return `${ALL_AUDIT_CATEGORIES.join(", ")}${aliases ? ` (aliases: ${aliases})` : ""}`;
}

// Main dispatch — runs when the file is executed (not just imported)
if (import.meta.main) {
  const parsed = parseArgs(process.argv.slice(2));
  let code = 0;
  switch (parsed.command) {
    case "audit":
      code = await runAuditCommand(parsed.target, parsed.flags);
      break;
    case "doctor":
      code = await runDoctorCommand();
      break;
    case "version":
      code = runVersionCommand();
      break;
    case "help":
    default:
      code = printHelp();
  }
  process.exit(code);
}
