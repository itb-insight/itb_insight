import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    authInterrupts: true, // To test unauthorized error page
  }
};

export default nextConfig;
