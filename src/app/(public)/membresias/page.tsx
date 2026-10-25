import Link from "next/link";
import { Empty, Gallery, PageHero, Section, VideoBand, stockNote } from "@/components/ui";
import { supabaseServer } from "@/lib/supabase/server";
import { formatPEN } from "@/lib/config";
export const metadata = { title: "Membresías" };
const periodLabel: Record<string, string> = { monthly: "Mensual", quarterly: "Trimestral", semiannual: "Semestral", annual: "Anual", day_pass: "Pase diario", session_pack: "Pase por sesiones", custom: "Personalizado" };
export default async function Page() {
  const sb = await supabaseServer();
  const { data: plans } = sb ? await sb.from("membership_plans").select("*").eq("is_public", true).order("price_cents") : { data: null };
  return (<>
    <PageHero media={{ video: "/media/video/strength.mp4" }} eyebrow="Membresías" title="Elige" accent="tu ritmo">Precio total, duración y condiciones visibles antes de pagar. Sin renovaciones automáticas sin tu autorización.</PageHero>
    <Section>{plans?.length ? (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{plans.map((p, i) => (
        <article key={p.id} className={`card flex flex-col p-8 ${i === 1 ? "border-lime" : ""}`}>
          <p className="eyebrow">{periodLabel[p.period]}{p.is_demo && " · DEMO"}</p>
          <h2 className="display mt-3 text-4xl">{p.name}</h2>
          <p className="display mt-6 text-5xl">{p.price_cents > 0 ? formatPEN(p.price_cents) : <span className="text-2xl text-mute">Precio por confirmar</span>}</p>
          {p.enrollment_fee_cents > 0 && <p className="text-sm text-mute">+ inscripción {formatPEN(p.enrollment_fee_cents)} · Total {formatPEN(p.price_cents + p.enrollment_fee_cents)}</p>}
          <p className="mt-2 text-sm text-mute">{p.duration_days ? `${p.duration_days} días` : ""}{p.sessions_included ? ` · ${p.sessions_included} sesiones` : ""}</p>
          <details className="mt-6 text-sm text-mute"><summary className="cursor-pointer">Términos</summary><p className="mt-2 whitespace-pre-line">{p.terms}</p></details>
          <Link href={`/portal/membresia?plan=${p.id}`} className="btn btn-lime mt-auto justify-center pt-4">Elegir plan</Link>
        </article>))}</div>
    ) : <Empty title="Planes por publicar">El gimnasio aún no ha configurado sus planes. Consulta en recepción.</Empty>}</Section>
  <VideoBand src="/media/video/intensity.mp4" title="Tu ritmo" accent="tus reglas" /><Section><Gallery items={[{ src: "/media/img/deadlift.webp", alt: "Fuerza", caption: "Fuerza" },{ src: "/media/img/facility.webp", alt: "Cardio", caption: "Cardio" },{ src: "/media/img/group-class.webp", alt: "Clases", caption: "Clases" }]} /><p className="mt-4 text-xs text-mute">{stockNote}</p></Section></>);
}
