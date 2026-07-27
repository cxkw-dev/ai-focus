/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  devIndicators: false,
  reactCompiler: true,
  experimental: {
    // React Compiler's Babel plugin does not run under Turbopack (the Next 16
    // default builder); the native Rust port runs it inside Turbopack instead.
    turbopackRustReactCompiler: true,
    // Next defaults `dynamic` to 0, so the client Router Cache is thrown away
    // the moment you leave a route: every hop between project boards paid a
    // fresh RSC round-trip before React would commit, and the old board stayed
    // frozen on screen for the duration. Nothing in these payloads is data —
    // every page is a client component fed by React Query and invalidated over
    // SSE — so holding them is free and makes back-and-forth instant.
    staleTimes: {
      dynamic: 300,
      static: 300,
    },
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
}

module.exports = nextConfig
