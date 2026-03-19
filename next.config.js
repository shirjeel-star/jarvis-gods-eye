/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Ensure ESM-only 3D/WebGL packages are transpiled correctly by webpack
  transpilePackages: ['react-globe.gl', 'globe.gl', 'three-globe', 'three-render-objects'],
}

module.exports = nextConfig
