import { PageHero, Section } from "@/components/ui";
import { sedes, wa, gym } from "@/lib/config";
export const metadata = { title: "Sedes" };
export default function Page() {
  return (<><PageHero media={{ img: "/media/img/hall.webp" }} eyebrow="Sedes" title="Dos sedes" accent="en Nuevo Chimbote">{gym.hours}</PageHero>
    <Section><div className="grid gap-8 lg:grid-cols-2">{sedes.map((s) => (
      <article key={s.id} data-reveal className="card overflow-hidden">
        <div className="p-8"><p className="eyebrow">{gym.name}</p><h2 className="display mt-3 text-5xl">{s.name}</h2><p className="mt-3 text-mute">{s.address}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a className="btn btn-lime" href={wa(s.phone, `Hola STARFIT ${s.name}, quiero información`)} target="_blank" rel="noopener">WhatsApp {s.phone.replace(/(\d{3})(\d{3})(\d{3})/, "$1 $2 $3")}</a>
            <a className="btn btn-ghost" target="_blank" rel="noopener" href={`https://www.google.com/maps/search/${encodeURIComponent(s.mapsQuery)}`}>Cómo llegar</a>
          </div></div>
        <iframe title={`Mapa ${s.name}`} className="h-72 w-full border-t border-line grayscale invert-[.9]" loading="lazy" src={`https://www.google.com/maps?q=${encodeURIComponent(s.mapsQuery)}&output=embed`} />
      </article>))}</div>
      <p className="mt-6 text-xs text-mute">{gym.hoursNote}</p></Section></>);
}
