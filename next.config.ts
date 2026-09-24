import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const MAX_UPLOAD_BODY_SIZE = 50 * 1024 * 1024; // 50 MB

const CSP_REPORT_ONLY = [
  "default-src 'self'",
  "base-uri 'self'",
  "frame-ancestors 'self'",
  "form-action 'self' https://*.moyasar.com",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https://fonts.gstatic.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.gstatic.com https://www.googletagmanager.com",
  "connect-src 'self' https: wss:",
].join("; ");

const SECURITY_HEADERS = [
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(self), payment=(self)",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  // Report-only: never blocks anything, so it is safe to ship. Flip to
  // "Content-Security-Policy" to enforce once reports confirm nothing breaks.
  { key: "Content-Security-Policy-Report-Only", value: CSP_REPORT_ONLY },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
  experimental: {
    serverActions: {
      // Avoid string parse issues at config load time
      bodySizeLimit: MAX_UPLOAD_BODY_SIZE,
    },
    // Proxy clones the request body and defaults to 10MB.
    // Large deed/sublease PDFs were truncated → "Unexpected end of form".
    proxyClientMaxBodySize: MAX_UPLOAD_BODY_SIZE,
    optimizePackageImports: [
      "lucide-react",
      "react-icons",
      "radix-ui",
      "recharts",
      "leaflet",
      "react-leaflet",
      "firebase",
      "date-fns",
    ],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "aqid.subcodeco.com",
        pathname: "/storage/**",
      },
      {
        protocol: "https",
        hostname: "aqid.subcodeco.com",
        pathname: "/uploads/**",
      },
      {
        protocol: "https",
        hostname: "aqid.subcodeco.com",
        pathname: "/images/**",
      },
    ],
  },
};

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

export default withNextIntl(nextConfig);
