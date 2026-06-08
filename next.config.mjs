/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Required since we are using 'better-sqlite3' and '@actual-app/api' which have native dependencies
  serverExternalPackages: ['better-sqlite3', '@actual-app/api']
};

export default nextConfig;
