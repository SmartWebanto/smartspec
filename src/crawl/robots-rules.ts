export type RobotsGroup = {
  userAgents: string[];
  rules: { type: "allow" | "disallow"; path: string }[];
};

export type RobotsRules = {
  groups: Map<string, RobotsGroup>;
  sitemaps: string[];
};

export function parseRobots(body: string): RobotsRules {
  const groups = new Map<string, RobotsGroup>();
  const sitemaps: string[] = [];
  let current: RobotsGroup | null = null;
  let startingNewGroup = true;

  for (const raw of body.split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, "").trim();
    if (!line) { startingNewGroup = true; continue; }
    const m = line.match(/^([a-zA-Z-]+)\s*:\s*(.+)$/);
    if (!m) continue;
    const field = m[1].toLowerCase();
    const value = m[2].trim();

    if (field === "user-agent") {
      if (startingNewGroup || !current) {
        const ua = value.toLowerCase();
        current = groups.get(ua) ?? { userAgents: [ua], rules: [] };
        groups.set(ua, current);
        startingNewGroup = false;
      } else {
        const ua = value.toLowerCase();
        current.userAgents.push(ua);
        groups.set(ua, current);
      }
    } else if (field === "disallow" || field === "allow") {
      if (current) {
        current.rules.push({ type: field, path: value });
        startingNewGroup = false;
      }
    } else if (field === "sitemap") {
      sitemaps.push(value);
    }
  }

  return { groups, sitemaps };
}

export function isAllowed(rules: RobotsRules | null, userAgent: string, url: string): boolean {
  if (!rules || rules.groups.size === 0) return true;
  const path = (() => { try { return new URL(url).pathname; } catch { return url; } })();
  const uaLower = userAgent.toLowerCase();

  let bestGroup: RobotsGroup | null = null;
  let bestLen = -1;
  for (const [token, group] of rules.groups) {
    if (token === "*") continue;
    if (uaLower.includes(token) && token.length > bestLen) {
      bestGroup = group;
      bestLen = token.length;
    }
  }
  const group = bestGroup ?? rules.groups.get("*") ?? null;
  if (!group) return true;

  let decision: "allow" | "disallow" = "allow";
  let bestRuleLen = -1;
  for (const r of group.rules) {
    if (r.path === "") continue;
    if (path.startsWith(r.path)) {
      if (r.path.length > bestRuleLen || (r.path.length === bestRuleLen && r.type === "allow")) {
        decision = r.type;
        bestRuleLen = r.path.length;
      }
    }
  }
  return decision === "allow";
}
