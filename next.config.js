/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  devIndicators: false,
  reactCompiler: true,
  experimental: {
    // React Compiler's Babel plugin does not run under Turbopack (the Next 16
    // default builder); the native Rust port runs it inside Turbopack instead.
    turbopackRustReactCompiler: true,
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
}

module.exports = nextConfig
