import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // Pin tracing root to this project so a parent lockfile (e.g. ~/package-lock.json)
  // does not make Next treat the home directory as the workspace root.
  // Do NOT set turbopack.root to the project dir — that triggers a known CSS
  // @import resolution bug in Next 16. Prefer webpack for local `npm run dev`.
  outputFileTracingRoot: projectRoot,
};

export default nextConfig;
