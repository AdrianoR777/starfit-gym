import type { NextConfig } from "next";
const csp = [
  "default-src 'self'", "script-src 'self' 'unsafe-inline' https://js.culqi.com https://checkout.culqi.com https://www.instagram.com", "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:", "media-src 'self' blob:", "connect-src 'self' https://graph.facebook.com https://*.supabase.co wss://*.supabase.co https://*.culqi.com",
  "frame-src https://*.culqi.com https://www.google.com https://www.instagram.com", "frame-ancestors 'none'", "base-uri 'self'", "form-action 'self'",
].join("; ");
const config: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: [
      { key: "Content-Security-Policy", value: csp }, { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" }, { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
      { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" },
    ] }];
  },
};
export default config;
