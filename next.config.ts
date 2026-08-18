import type { NextConfig } from "next";

// The Next.js API routes run on Vercel: they classify with OpenAI (a region that
// OpenAI actually serves) and persist to the CivicLens SQLite backend on Azure
// via lib/store.ts (server-side HTTP, so no browser mixed-content issue).
// Configure the backend with BACKEND_URL; it defaults to the Azure VM in prod.
const nextConfig: NextConfig = {
  serverExternalPackages: ["openai"],
};

export default nextConfig;
