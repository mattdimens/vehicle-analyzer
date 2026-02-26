import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Issue #23 — allow next/image to load Supabase-hosted images
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            // TODO (Issue #7): 'unsafe-inline' and 'unsafe-eval' are required by
            // Next.js in development. For production, consider using nonces via
            // middleware (next/headers) or switching to 'strict-dynamic' to
            // tighten XSS protection. See:
            // https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' blob: data: https://*.supabase.co",
              "connect-src 'self' https://*.supabase.co https://www.google-analytics.com https://generativelanguage.googleapis.com",
              "frame-ancestors 'none'",
            ].join("; "),
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
