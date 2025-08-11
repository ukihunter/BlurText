import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.dicebear.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "external-content.duckduckgo.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "static.dw.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
