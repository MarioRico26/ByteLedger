/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["pdfkit"],
  outputFileTracingIncludes: {
    "/api/estimates/**": ["node_modules/pdfkit/js/data/**"],
  },
}

module.exports = nextConfig
