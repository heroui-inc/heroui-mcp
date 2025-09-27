import { defineConfig } from "tsup";
import packageJson from "./package.json";

export default defineConfig({
  // STDIO build for NPM package
  entry: ["src/stdio.ts"],
  outDir: "dist",
  format: ["esm"],
  target: "node18",
  platform: "node",
  shims: false,
  dts: false,
  clean: true,
  minify: false,
  sourcemap: false,
  external: ["@modelcontextprotocol/sdk"],
  banner: {
    js: "#!/usr/bin/env node",
  },
  define: {
    __PACKAGE_NAME__: JSON.stringify(packageJson.name),
    __PACKAGE_VERSION__: JSON.stringify(packageJson.version),
  },
  esbuildOptions(options) {
    options.pure = ["console.log", "console.info"];
    options.treeShaking = true;
  },
});