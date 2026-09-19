/** @type {import('next').NextConfig} */
const nextConfig = {
  // pdf-parse (via pdfjs-dist) breaks when webpack bundles it into the RSC
  // route layer — keep it a real Node require instead.
  experimental: {
    serverComponentsExternalPackages: ["pdf-parse", "pdfjs-dist"],
  },
};

module.exports = nextConfig;
