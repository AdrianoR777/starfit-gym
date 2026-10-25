import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return { name: "STARFIT GYM", short_name: "STARFIT", start_url: "/portal", display: "standalone", background_color: "#080A0A", theme_color: "#080A0A", icons: [{ src: "/icon-192.png", sizes: "192x192", type: "image/png" }, { src: "/icon-512.png", sizes: "512x512", type: "image/png" }] };
}
