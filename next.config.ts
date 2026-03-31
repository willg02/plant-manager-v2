import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "pdf-parse"],
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default withSentryConfig(nextConfig, {
  // Suppress logs when SENTRY_AUTH_TOKEN is not set
  silent: true,

  // Upload source maps for better stack traces (only when auth token is available)
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },
});
