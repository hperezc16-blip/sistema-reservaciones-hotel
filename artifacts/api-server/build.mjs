import { build } from "esbuild";

await build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  platform: "node",
  target: "node20",
  format: "esm",
  outfile: "dist/index.mjs",
  sourcemap: true,
  packages: "external",
  plugins: [
    {
      name: "workspace-bundler",
      setup(builder) {
        // Inline @workspace/* packages instead of marking them external,
        // so esbuild transpiles their TypeScript source directly.
        // All npm packages (pg, drizzle-orm, express, etc.) remain external
        // thanks to the top-level `packages: "external"` option.
        builder.onResolve({ filter: /^@workspace\// }, async (args) => {
          const resolved = await builder.resolve(args.path, {
            kind: args.kind,
            resolveDir: args.resolveDir,
          });
          return { path: resolved.path, external: false };
        });
      },
    },
  ],
});
