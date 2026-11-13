/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  eslint: {
    // Jangan gagalkan build karena warning ESLint (misal <img> tag)
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
