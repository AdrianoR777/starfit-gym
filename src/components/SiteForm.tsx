"use client";
import { useActionState } from "react";
import { saveSite } from "@/lib/admin-actions";
import { Msg } from "./AuthForms";
import type { Site } from "@/lib/site";

const F = ({ label, name, value, max, type = "text" }: { label: string; name: string; value: string; max?: number; type?: string }) => (
  <label className="block"><span className="text-sm text-mute">{label}</span><input id={`s-${name}`} name={name} type={type} defaultValue={value} maxLength={max} className="field mt-1" /></label>);

export default function SiteForm({ s }: { s: Site }) {
  const [st, act, pending] = useActionState(saveSite, undefined);
  return (
    <form action={act} className="space-y-8">
      <fieldset className="card grid gap-4 p-6 md:grid-cols-2"><legend className="px-2 font-semibold">Marca</legend>
        <F label="Nombre del gimnasio" name="gym_name" value={s.name} max={60} />
        <F label="Frase de marca" name="tagline" value={s.tagline} max={160} />
        <label className="block"><span className="text-sm text-mute">Logo (PNG/SVG/WEBP, máx. 2 MB)</span><input id="s-logo" name="logo" type="file" accept="image/png,image/svg+xml,image/webp,image/jpeg" className="field mt-1" /></label>
        <div className="flex gap-4">
          <label className="block"><span className="text-sm text-mute">Color de acento</span><input id="s-accent" name="color_accent" type="color" defaultValue={s.accent} className="mt-1 h-12 w-20 rounded-lg bg-transparent" /></label>
          <label className="block"><span className="text-sm text-mute">Color de fondo</span><input id="s-ink" name="color_ink" type="color" defaultValue={s.ink} className="mt-1 h-12 w-20 rounded-lg bg-transparent" /></label>
        </div>
      </fieldset>
      <fieldset className="card grid gap-4 p-6 md:grid-cols-2"><legend className="px-2 font-semibold">Portada</legend>
        <F label="Título (línea 1)" name="hero_title" value={s.heroTitle} max={80} />
        <F label="Título destacado (línea 2)" name="hero_accent" value={s.heroAccent} max={80} />
        <div className="md:col-span-2"><F label="Subtítulo" name="hero_subtitle" value={s.heroSubtitle} max={240} /></div>
        <label className="block md:col-span-2"><span className="text-sm text-mute">Video de portada (MP4, máx. 25 MB; recomendado 720p, sin audio)</span><input id="s-video" name="hero_video" type="file" accept="video/mp4" className="field mt-1" /></label>
      </fieldset>
      <fieldset className="card grid gap-4 p-6 md:grid-cols-2"><legend className="px-2 font-semibold">Contacto y redes</legend>
        <F label="Horario (texto)" name="hours_text" value={s.hours} max={120} />
        <F label="Enlace de inscripción" name="signup_url" value={s.signup} type="url" />
        <F label="Instagram" name="instagram_url" value={s.instagram} type="url" />
        <F label="TikTok" name="tiktok_url" value={s.tiktok} type="url" />
        <F label="Facebook" name="facebook_url" value={s.facebook} type="url" />
      </fieldset>
      <div className="flex items-center gap-4"><button disabled={pending} className="btn btn-lime">{pending ? "Publicando…" : "Publicar cambios"}</button><Msg s={st} /></div>
    </form>);
}
