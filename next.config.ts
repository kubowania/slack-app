import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Info 1: Suppress the X-Powered-By: Next.js header to reduce
     attack-surface information disclosed to clients. */
  poweredByHeader: false,

  /* Issues 2 & 3: Add baseline security headers to every response.
     - X-Content-Type-Options: nosniff  — prevents MIME-type sniffing
     - X-Frame-Options: DENY            — prevents clickjacking via iframes
     - Content-Security-Policy frame-ancestors — modern clickjacking guard
     - Referrer-Policy                   — limits referrer information leakage
     - X-DNS-Prefetch-Control           — controls DNS prefetching */
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors 'none'",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
