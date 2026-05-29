import { build } from "esbuild";
import { readFileSync } from "fs";

const pkg = JSON.parse(readFileSync("package.json", "utf8"));

// Bundle workspace packages inline; keep npm packages external
const externalDeps = Object.keys(pkg.dependencies || {}).filter(
  (dep) => !dep.startsWith("@workspace/")
);

await build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  platform: "node",
  target: "node20",
  format: "esm",
  outfile: "dist/index.mjs",
  sourcemap: true,
  external: externalDeps,
});
