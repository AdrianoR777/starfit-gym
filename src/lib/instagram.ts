import "server-only";

// Integración oficial: Instagram Graph API (Business Discovery). Requiere una cuenta profesional de IG
// vinculada a una app de Meta. Sin token devuelve null y la web usa los datos locales.
export type IgProfile = { name?: string; biography?: string; website?: string; profile_picture_url?: string; media: { id: string; media_url?: string; thumbnail_url?: string; permalink: string; caption?: string; media_type: string }[] };

export async function instagramProfile(): Promise<IgProfile | null> {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN, me = process.env.INSTAGRAM_BUSINESS_ID;
  const user = process.env.INSTAGRAM_USERNAME ?? "sstarfitgym";
  if (!token || !me) return null;
  const fields = `business_discovery.username(${user}){name,biography,website,profile_picture_url,media.limit(12){id,media_url,thumbnail_url,permalink,caption,media_type}}`;
  try {
    const r = await fetch(`https://graph.facebook.com/v21.0/${me}?fields=${encodeURIComponent(fields)}&access_token=${token}`, { next: { revalidate: 3600 } });
    if (!r.ok) return null;
    const bd = (await r.json()).business_discovery;
    return { ...bd, media: bd?.media?.data ?? [] };
  } catch { return null; }
}
