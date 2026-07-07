import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Sponsor logo uploads can be up to ~2MB; the default 1MB Server Action
      // body limit would reject them. Leave headroom for multipart overhead.
      bodySizeLimit: "3mb",
    },
  },
};

export default nextConfig;
