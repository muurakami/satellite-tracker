import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow HMR from local network devices (e.g. mobile testing)
  allowedDevOrigins: ["192.168.1.102"],
  output: "standalone",
};

export default nextConfig;
