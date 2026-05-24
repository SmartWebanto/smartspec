// tsup.config.ts
import { defineConfig } from "tsup";

export default defineConfig({
  entry: { cli: "src/cli.ts" },
  format: ["esm"],
  target: "node20",
  outDir: "dist/npm",
  clean: true,
  sourcemap: true,
  splitting: false,
  bundle: true,
  banner: { js: "#!/usr/bin/env node" },
  external: ["cheerio", "fast-xml-parser"], // kept as runtime deps
  define: {
    "process.env.SMARTSPEC_VERSION": JSON.stringify(process.env.SMARTSPEC_VERSION ?? "0.1.0"),
    "process.env.SMARTSPEC_COMMIT": JSON.stringify(process.env.SMARTSPEC_COMMIT ?? "unknown"),
  },
});
