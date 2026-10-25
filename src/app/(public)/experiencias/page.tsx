import { PageHero, Section } from "@/components/ui";
import { IgEmbeds } from "@/components/IgEmbed";
import { igPosts } from "@/lib/config";
export const metadata = { title: "Experiencias" };
const events = [["Fiestas Patrias", "Jornadas en Sede Pardo y Sede Agraria con premios, sorpresas y orgullo peruano."], ["Día de la Mujer", "Un evento para celebrar la fuerza y la constancia de nuestra comunidad."], ["Cierre de Verano", "Bailetón, yunsa y retos fit para cerrar la temporada."], ["Functional Kids", "Clausura del taller infantil con nuestros pequeños campeones."]];
export default function Page() {
  return (<><PageHero media={{ img: "/media/img/ropes.webp" }} eyebrow="Experiencias" title="Aquí no solo" accent="venimos a entrenar">Venimos a vivir experiencias. Así se vive la comunidad STARFIT.</PageHero>
    <Section><div className="grid gap-4 md:grid-cols-4">{events.map(([t, d]) => <div key={t} data-reveal className="card p-6"><p className="display text-2xl">{t}</p><p className="mt-2 text-sm text-mute">{d}</p></div>)}</div></Section>
    <Section><IgEmbeds codes={igPosts.eventos} /></Section></>);
}
