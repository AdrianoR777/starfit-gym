import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Archivo, Inter } from "next/font/google";

const display = Archivo({ subsets: ["latin"], weight: ["900"], variable: "--font-archivo", display: "swap" });
const sans = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
import { gym, sedes } from "@/lib/config";
import { getSite } from "@/lib/site";

const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
export const metadata: Metadata = {
  metadataBase: new URL(site),
  title: { default: gym.title, template: `%s · ${gym.name}` },
  description: "Porque estar fit no es solo verse bien, sino sentirse bien. Gimnasio con 2 sedes en Nuevo Chimbote (Pardo y Agraria): clases de Baile, Funcional, Xbox, Zumba, Step y Functional Kids. 6:00 a. m. – 10:30 p. m.",
  keywords: ["gimnasio Nuevo Chimbote", "gym Chimbote", "STARFIT GYM", "musculación Chimbote", "entrenamiento funcional Chimbote"],
  icons: { icon: "/brand/logo.png", apple: "/icon-192.png" },
  openGraph: { images: ["/brand/logo.png"], type: "website", locale: "es_PE", siteName: gym.name },
  
};
export const viewport: Viewport = { themeColor: "#080A0A", width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const ld = { "@context": "https://schema.org", "@graph": sedes.map((s) => ({ "@type": "ExerciseGym", name: `${gym.name} – ${s.name}`, telephone: `+51${s.phone}`, sameAs: [gym.instagram, gym.tiktok, gym.facebook], openingHours: "Mo-Sa 06:00-22:30", address: { "@type": "PostalAddress", streetAddress: s.address, addressLocality: "Nuevo Chimbote", addressRegion: "Áncash", addressCountry: "PE" } })) };
  return (
    <html lang="es-PE" className={`${display.variable} ${sans.variable}`}>
      <head><style>{`:root{--lime:${(await getSite()).accent};--ink:${(await getSite()).ink}}`}</style></head>
      <body>
        {children}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      </body>
    </html>
  );
}
