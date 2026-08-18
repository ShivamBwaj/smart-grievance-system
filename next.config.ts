import type { NextConfig } from "next";

// In production (Vercel) the frontend proxies /api/* to the CivicLens backend
// on Azure, server-side, so the HTTPS page never makes a mixed-content call to
// the HTTP origin. Locally (dev) there is no origin, so Next's own /api route
// handlers serve the requests. Override with API_ORIGIN if the backend moves.
const API_ORIGIN =
  process.env.API_ORIGIN || (process.env.NODE_ENV === "production" ? "http://52.184.22.2" : "");

const nextConfig: NextConfig = {
  serverExternalPackages: ["openai"],
  async rewrites() {
    if (!API_ORIGIN) return { beforeFiles: [] };
    return {
      beforeFiles: [{ source: "/api/:path*", destination: `${API_ORIGIN}/api/:path*` }],
    };
  },
};

export default nextConfig;
