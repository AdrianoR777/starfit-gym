import type { MetadataRoute } from "next";
const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "ocupacion", "tecnologia", "nosotros", "instalaciones", "entrenadores", "membresias", "clases", "horarios", "servicios", "experiencias", "sedes", "faq", "contacto", "blog", "registro", "login"]
    .map((p) => ({ url: `${base}/${p}`, changeFrequency: "weekly", priority: p ? 0.7 : 1 }));
}
