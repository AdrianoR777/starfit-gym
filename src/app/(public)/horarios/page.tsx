import { PageHero, Section } from "@/components/ui";
import { Schedule } from "@/components/Schedule";
import { gym, groupClasses } from "@/lib/config";
export const metadata = { title: "Horarios" };
export const revalidate = 60;
export default function Page() {
  return (<><PageHero media={{ img: "/media/img/dumbbells.webp" }} eyebrow="Horarios" title="6:00 a. m." accent="10:30 p. m.">Horario extendido: madruga, entrena después del trabajo o en tu momento ideal.</PageHero>
    <Section>
      <div data-reveal className="card mb-10 p-8"><p className="eyebrow">Sala de máquinas</p><p className="display mt-3 text-4xl">{gym.hours}</p><p className="mt-2 text-xs text-mute">{gym.hoursNote}</p></div>
      <h2 className="display mb-6 text-4xl">Clases grupales</h2>
      <div className="mb-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">{groupClasses.map(([n, d]) => <div key={n} data-reveal className="card p-6"><p className="display text-3xl text-lime">{n}</p><p className="mt-2 text-sm text-mute">{d}</p></div>)}</div>
      <p className="mb-4 text-mute">Las horas de cada clase grupal se publican en Instagram. Reserva tu cupo desde el portal cuando estén cargadas en el sistema:</p>
      <Schedule />
    </Section></>);
}
