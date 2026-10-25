import { PageHero, Section } from "@/components/ui";
import { gym, sedes, wa } from "@/lib/config";
import { ContactForm } from "@/components/SmartForms";
export const metadata = { title: "Contacto" };
export default function Page() {
  return (<><PageHero media={{ img: "/media/img/press.webp" }} eyebrow="Contacto" title="Hablemos">Escríbenos por WhatsApp a la sede más cercana o solicita tu inscripción en línea.</PageHero>
    <Section><div className="grid gap-6 md:grid-cols-2">
      {sedes.map((s) => (
        <a key={s.id} href={wa(s.phone)} target="_blank" rel="noopener" data-reveal className="card p-10 hover:border-lime">
          <p className="eyebrow">WhatsApp · {s.name}</p><p className="display mt-3 text-4xl">{s.phone.replace(/(\d{3})(\d{3})(\d{3})/, "$1 $2 $3")}</p><p className="mt-2 text-mute">{s.address}</p></a>))}
      <a href={gym.signup} target="_blank" rel="noopener" data-reveal className="card !bg-lime !border-lime p-10 text-ink md:col-span-2"><p className="eyebrow !text-ink/60">Inscripción</p><p className="display mt-3 text-4xl">Solicita mayor información →</p></a>
      {([["Instagram", "@sstarfitgym", gym.instagram], ["TikTok", "@sstarfitgym", gym.tiktok], ["Facebook", "/sstarfit", gym.facebook]] as const).map(([n, h, u]) => (
        <a key={n} href={u} target="_blank" rel="noopener" data-reveal className="card p-8 hover:border-lime"><p className="eyebrow">{n}</p><p className="display mt-2 text-3xl">{h}</p></a>))}
      <div data-reveal className="card p-8"><p className="eyebrow">Horario</p><p className="mt-2 text-xl">{gym.hours}</p><p className="mt-2 text-xs text-mute">{gym.hoursNote}</p></div>
    </div></Section>
    <Section><h2 className="display mb-6 text-4xl">Escríbenos</h2><ContactForm /></Section></>);
}
