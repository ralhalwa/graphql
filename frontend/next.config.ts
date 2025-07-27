import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_AUTH_API: process.env.NEXT_PUBLIC_AUTH_API,
    NEXT_PUBLIC_GRAPHQL_API: process.env.NEXT_PUBLIC_GRAPHQL_API,
  },
};

export default nextConfig;
