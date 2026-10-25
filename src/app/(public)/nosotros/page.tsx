import { Gallery, PageHero, Section, VideoBand, stockNote } from "@/components/ui";
import { gym } from "@/lib/config";
export const metadata = { title: "Sobre nosotros" };
export default function Page() {
  return (<>
    <PageHero media={{ video: "/media/video/intensity.mp4" }} eyebrow="Sobre nosotros" title={gym.name} accent="Chimbote">
      {gym.tagline}. Somos una comunidad que entrena, se apoya y crece junta en Nuevo Chimbote.
    </PageHero>
    <Section>
      <dl data-reveal className="mb-12 grid gap-px overflow-hidden rounded-3xl border border-line bg-line md:grid-cols-3">
        {[["2 sedes", "Pardo y Agraria"], ["16,5 h", "abiertos al día: 6:00 a. m. – 10:30 p. m."], ["4 200+", "seguidores en Instagram"]].map(([v, l]) => (
          <div key={l} className="bg-ink p-8"><dt className="display text-5xl text-lime">{v}</dt><dd className="mt-2 text-mute">{l}</dd></div>))}
      </dl>
      <div className="grid gap-6 md:grid-cols-3">
        {[["Técnica primero", "Progresar con seguridad antes que con prisa."], ["A tu ritmo", "Planes adaptados a tu disponibilidad y experiencia."], ["Bienestar real", "El descanso también es parte del entrenamiento."]].map(([t, d]) => (
          <div key={t} className="card p-8"><h2 className="display text-3xl">{t}</h2><p className="mt-3 text-mute">{d}</p></div>
        ))}
      </div>
      <p className="mt-10 text-sm text-mute">Síguenos en <a className="underline" href={gym.instagram} target="_blank" rel="noopener">Instagram</a> y <a className="underline" href={gym.facebook} target="_blank" rel="noopener">Facebook</a> para ver el día a día del gimnasio.</p>
    </Section>
  <VideoBand src="/media/video/hero.mp4" title="Sin atajos" accent="solo trabajo" /><Section><Gallery items={[{ src: "/media/img/group-class.webp", alt: "Comunidad", caption: "Comunidad" },{ src: "/media/img/curl.webp", alt: "Técnica", caption: "Técnica" },{ src: "/media/img/deadlift.webp", alt: "Constancia", caption: "Constancia" },{ src: "/media/img/yoga.webp", alt: "Equilibrio", caption: "Equilibrio" },{ src: "/media/img/squat.webp", alt: "Fuerza", caption: "Fuerza" }]} /><p className="mt-4 text-xs text-mute">{stockNote}</p></Section></>);
}
