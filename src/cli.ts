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
  if (cmd === "--version" || cmd === "-v") {
    return { command: "version", flags: { ...DEFAULT_FLAGS } };
  }
  if (cmd === "--help" || cmd === "-h") {
    return { command: "help", flags: { ...DEFAULT_FLAGS } };
  }
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
        if (i + 1 < rest.length) flags.categories = rest[++i].split(",").map(s => s.trim());
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
      categories: flags.categories,
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

  // Phase 1: format-aware output is added in Phase 5. For now: console = brief, others = JSON.
  if (flags.format === "console") {
    stdout.write(`score: ${result.score}\n`);
    stdout.write(`findings: ${result.findings.length}\n`);
  } else {
    stdout.write(JSON.stringify(result, null, 2) + "\n");
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
  try {
    const proc = Bun.spawn(["python3", "--version"], { stdout: "pipe", stderr: "pipe" });
    const out = await new Response(proc.stdout).text();
    await proc.exited;
    return out.trim() || "found";
  } catch {
    return "not found";
  }
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
  -o, --output <path>   Write output to file instead of stdout
  -m, --max-pages <n>   Crawl limit (default: 250)
  --categories <list>   Comma-separated subset (e.g. seo,a11y)
  --no-fixes            Skip suggested_fix emission
  --no-plugins          Skip Python plugins
  -q, --quiet           Suppress progress
  --verbose             Verbose logs to stderr
`);
  return 0;
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
