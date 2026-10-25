import { Empty, Gallery, PageHero, Section, stockNote } from "@/components/ui";
import { supabaseServer } from "@/lib/supabase/server";
export const metadata = { title: "Entrenadores" };
export default async function Page() {
  const sb = await supabaseServer();
  const { data } = sb ? await sb.from("trainers").select("id,bio,specialties,certifications").eq("is_public", true) : { data: null };
  return (<>
    <PageHero media={{ img: "/media/img/bench-coach.webp", alt: "Entrenador asistiendo un press de banca" }} eyebrow="Equipo" title="Entrenadores">Profesionales que corrigen, acompañan y adaptan cada plan.</PageHero>
    <Section>{data?.length ? (
      <div className="grid gap-6 md:grid-cols-3">{data.map((t) => (
        <article key={t.id} className="card p-8"><p className="text-mute">{t.bio}</p><p className="mt-4 text-sm">{t.specialties.join(" · ")}</p></article>))}</div>
    ) : <Empty title="Perfiles en preparación">Los entrenadores aparecerán aquí cuando el gimnasio publique sus perfiles verificados.</Empty>}</Section>
  <Section><Gallery items={[{ src: "/media/img/curl.webp", alt: "Corrección técnica", caption: "Técnica" },{ src: "/media/img/bench-coach.webp", alt: "Acompañamiento", caption: "Acompañamiento" },{ src: "/media/img/squat.webp", alt: "Progresión segura", caption: "Progresión" }]} /><p className="mt-4 text-xs text-mute">{stockNote}</p></Section></>);
}
