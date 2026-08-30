import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { NextConfig } from 'next';

const packageRoot = path.dirname(fileURLToPath(import.meta.url));
const monorepoRoot = path.join(packageRoot, '..', '..');

const nextConfig: NextConfig = {
  // A self-contained Node server, so the runtime image needs no node_modules.
  output: 'standalone',
  // Traces from the workspace root: the app resolves engine source and hoisted
  // dependencies from outside its own directory.
  outputFileTracingRoot: monorepoRoot,

  turbopack: {
    root: monorepoRoot,
  },

  // Dev only. Without this, reaching the dev server on 127.0.0.1 rather than
  // localhost blocks its asset requests and the page renders blank.
  allowedDevOrigins: ['127.0.0.1'],

  // Next regenerates its own AGENTS.md/CLAUDE.md at the package root on every
  // build. This package already publishes `public/AGENTS.md`, the form-authoring
  // instruction pack served at /AGENTS.md and asserted on by the build, so a
  // second file of the same name here is a trap.
  agentRules: false,

  // The engine is consumed as its built CJS `dist`, the same way `packages/api`
  // consumes it, so run `npm run build -w @declarativeforms/engine` first.
  //
  // The Vite app aliased `@declarativeforms/engine` to `../engine/src/index.ts`
  // instead. Turbopack silently ignores `resolveAlias` for this, so pointing at
  // source here would look wired up while actually resolving `dist` anyway, and
  // the types would then be free to disagree with the shipped JavaScript.
  transpilePackages: ['@declarativeforms/engine'],

  // handlebars' Node entry registers `require.extensions`, which bundlers reject.
  serverExternalPackages: ['handlebars'],

  // The browser calls `/api/v1/...` same-origin; this proxies it to the backend,
  // replacing the nginx `location /api/` block. Rewrites stream the request
  // body, which the 10 MiB multipart upload path depends on.
  //
  // Note this destination is baked into `routes-manifest.json` at build time.
  // The Compose service name is fixed, so that is fine, but it is not a
  // runtime-configurable value.
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.API_INTERNAL_ORIGIN ?? 'http://api:8080'}/api/:path*`,
      },
    ];
  },

  // Agent-facing documents. nginx set these; Next has to as well, and `.md`
  // needs an explicit type or it downloads instead of rendering.
  async headers() {
    const agentFacing = [
      { key: 'Access-Control-Allow-Origin', value: '*' },
      { key: 'Cache-Control', value: 'public, max-age=300' },
    ];

    return [
      { source: '/schema.json', headers: agentFacing },
      {
        source: '/AGENTS.md',
        headers: [
          ...agentFacing,
          { key: 'Content-Type', value: 'text/markdown; charset=utf-8' },
        ],
      },
      {
        source: '/llms.txt',
        headers: [
          ...agentFacing,
          { key: 'Content-Type', value: 'text/plain; charset=utf-8' },
        ],
      },
    ];
  },
};

export default nextConfig;
