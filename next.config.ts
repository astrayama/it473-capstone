import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Produces a minimal self-contained server in .next/standalone for the Docker image.
  output: "standalone",
  // Product photos are served straight from Cloud Storage; skip the image optimizer
  // so the container does not need `sharp` and works on Cloud Run without extra setup.
  images: { unoptimized: true },
  // Node-only packages that should not be bundled into server components.
  serverExternalPackages: ["@google-cloud/storage", "pg"],
};

export default nextConfig;
