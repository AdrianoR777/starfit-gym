import { existsSync } from "node:fs";
import path from "node:path";
import { Unbounded, Instrument_Serif, Figtree } from "next/font/google";
import { IgEmbeds } from "@/components/IgEmbed";
import { igPosts, integrations } from "@/lib/config";
import { IgFeed } from "@/components/IgFeed";
import { getSite } from "@/lib/site";
import { logoSrc } from "@/lib/brand";
import LandingSections from "@/components/LandingSections";
import LandingMotion from "@/components/LandingMotion";
import "@/components/landing.css";

const display = Unbounded({ subsets: ["latin"], weight: ["600", "700", "800"], variable: "--font-unbounded", display: "swap" });
const accent = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-instrument", display: "swap" });
const body = Figtree({ subsets: ["latin"], variable: "--font-figtree", display: "swap" });
export const revalidate = 300;

export default async function Home() {
  const [site, logo] = await Promise.all([getSite(), logoSrc()]);
  const heroVideo = site.heroVideo ?? (existsSync(path.join(process.cwd(), "public/media/hero.mp4")) ? "/media/hero.mp4" : "/media/video/hero.mp4");
  return <>
    <LandingMotion className={`${display.variable} ${accent.variable} ${body.variable}`}>
      <LandingSections site={site} logo={logo ?? "/brand/logo.png"} heroVideo={heroVideo} configured={integrations.supabase} />
    </LandingMotion>
    <section className="mx-auto max-w-7xl px-4 py-28 md:px-8"><p className="eyebrow mb-3">Instagram · @sstarfitgym</p><h2 className="display mb-10 text-5xl md:text-7xl">Familia <span className="text-lime">Starfit</span></h2><IgEmbeds codes={igPosts.home} /></section>
    <IgFeed />
  </>;
}
