import { existsSync } from "node:fs";
import path from "node:path";
import { IgEmbeds } from "@/components/IgEmbed";
import { igPosts } from "@/lib/config";
import { IgFeed } from "@/components/IgFeed";
import { getSite } from "@/lib/site";
import HomeExperience from "@/components/HomeExperience";
import { supabaseServer } from "@/lib/supabase/server";

export const revalidate = 300;

export default async function Home() {
  const sb = await supabaseServer();
  let stats = { locations: null as number | null, zones: null as number | null, classesWeek: null as number | null };
  if (sb) {
    const now = new Date(), week = new Date(Date.now() + 7 * 864e5);
    const [l, z, c] = await Promise.all([
      sb.from("gym_locations").select("*", { count: "exact", head: true }),
      sb.from("training_zones").select("*", { count: "exact", head: true }),
      sb.from("class_schedules").select("*", { count: "exact", head: true }).gte("starts_at", now.toISOString()).lt("starts_at", week.toISOString()).eq("cancelled", false),
    ]);
    stats = { locations: l.count || null, zones: z.count || null, classesWeek: c.count || null };
  }
  const site = await getSite();
  const heroVideo = site.heroVideo ?? (existsSync(path.join(process.cwd(), "public/media/hero.mp4")) ? "/media/hero.mp4" : "/media/video/hero.mp4");
  return (<><HomeExperience stats={stats} heroVideo={heroVideo} hero={{ title: site.heroTitle, accent: site.heroAccent, subtitle: site.heroSubtitle, signup: site.signup }} /><section className="mx-auto max-w-7xl px-4 pb-28 md:px-8"><p className="eyebrow mb-3">Instagram · @sstarfitgym</p><h2 className="display mb-10 text-5xl md:text-7xl">Familia <span className="text-lime">Starfit</span></h2><IgEmbeds codes={igPosts.home} /></section><IgFeed /></>);
}
