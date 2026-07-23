import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["geo-tz"],
  outputFileTracingIncludes: {
    "/api/geocode": ["./node_modules/geo-tz/data/**/*"],
  },
};

export default nextConfig;
