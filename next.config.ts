import type { NextConfig } from "next";

// cacheComponents este dezactivat intenționat: aproape toate datele sunt private
// și citite din sesiune. Vezi docs/ARCHITECTURE.md („Randare și cache”).
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    // Locația doar pentru site-ul nostru: butonul „Locația mea” din Trasee.
    value: "camera=(), microphone=(), geolocation=(self), payment=()",
  },
];

const nextConfig: NextConfig = {
  devIndicators: false,
  poweredByHeader: false,
  // OCR-ul pentru orar își pornește propriul worker din node_modules; nu îl împachetăm.
  serverExternalPackages: ["tesseract.js"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  experimental: {
    serverActions: {
      // Încărcarea PDF-urilor trece prin Storage direct, nu prin Server Actions.
      bodySizeLimit: "1mb",
    },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
