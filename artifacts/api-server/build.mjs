import { build } from "esbuild";
import { pino } from "esbuild-plugin-pino";

await build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  platform: "node",
  target: "node20",
  format: "esm",
  outfile: "dist/index.mjs",
  sourcemap: true,
  packages: "external",
  plugins: [pino({ transports: ["pino-pretty"] })],
});
