import "server-only";
import { cache } from "react";
import { gym } from "./config";
import { createClient } from "@supabase/supabase-js";
import { integrations } from "./config";

// Configuración editable desde Administración → Contenido. Si no hay BD, usa los valores por defecto de config.ts.
export type Site = {
  name: string; tagline: string; heroTitle: string; heroAccent: string; heroSubtitle: string; heroVideo: string | null;
  logo: string | null; accent: string; ink: string; hours: string; instagram: string; tiktok: string; facebook: string; signup: string;
};
export const defaults: Site = {
  name: gym.name, tagline: gym.tagline, heroTitle: "Beyond", heroAccent: "your limits",
  heroSubtitle: `${gym.tagline}. Dos sedes en Nuevo Chimbote · 6:00 a. m. – 10:30 p. m.`, heroVideo: null,
  logo: null, accent: "#C9FF43", ink: "#080A0A", hours: gym.hours, instagram: gym.instagram, tiktok: gym.tiktok, facebook: gym.facebook, signup: gym.signup,
};

export const getSite = cache(async (): Promise<Site & { orgId: string | null }> => {
  // cliente anónimo sin cookies: el contenido es público y así las páginas siguen siendo cacheables
  if (!integrations.supabase) return { ...defaults, orgId: null };
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });
  const { data: org } = await sb.from("organizations").select("id").order("created_at").limit(1).maybeSingle();
  if (!org) return { ...defaults, orgId: null };
  const { data: s } = await sb.from("site_settings").select("*").eq("organization_id", org.id).maybeSingle();
  if (!s) return { ...defaults, orgId: org.id };
  const pick = <T,>(v: T | null | undefined, d: T) => (v === null || v === undefined || v === "" ? d : v);
  return {
    orgId: org.id, name: pick(s.gym_name, defaults.name), tagline: pick(s.tagline, defaults.tagline),
    heroTitle: pick(s.hero_title, defaults.heroTitle), heroAccent: pick(s.hero_accent, defaults.heroAccent), heroSubtitle: pick(s.hero_subtitle, defaults.heroSubtitle),
    heroVideo: s.hero_video_path ?? null, logo: s.logo_path ?? null, accent: s.color_accent, ink: s.color_ink, hours: pick(s.hours_text, defaults.hours),
    instagram: pick(s.instagram_url, defaults.instagram), tiktok: pick(s.tiktok_url, defaults.tiktok), facebook: pick(s.facebook_url, defaults.facebook), signup: pick(s.signup_url, defaults.signup),
  };
});
