import { PageHero, Section, VideoBand } from "@/components/ui";
import { IgEmbeds } from "@/components/IgEmbed";
import { groupClasses, igPosts } from "@/lib/config";
export const metadata = { title: "Clases" };
export default function Page() {
  return (<>
    <PageHero media={{ img: "/media/img/group-class.webp", alt: "Clase grupal" }} eyebrow="Clases grupales" title="Más clases" accent="más energía">Baile, Funcional, Xbox, Zumba y Step, además del Taller Functional Kids.</PageHero>
    <Section><div className="grid gap-6 md:grid-cols-3">{groupClasses.map(([n, d], i) => (
      <article key={n} data-reveal className="card p-8"><span className="display text-5xl text-line">0{i + 1}</span><h2 className="display mt-4 text-4xl">{n}</h2><p className="mt-2 text-mute">{d}</p></article>))}
      <article data-reveal className="card border-lime p-8"><span className="display text-5xl text-line">06</span><h2 className="display mt-4 text-4xl">Functional Kids</h2><p className="mt-2 text-mute">Taller para niños: coordinación, confianza, disciplina y trabajo en equipo en un ambiente seguro.</p></article>
    </div></Section>
    <VideoBand src="/media/video/intensity.mp4" title="Entrena" accent="sin excusas" />
    <Section><p className="eyebrow mb-6">Desde nuestro Instagram</p><IgEmbeds codes={[...igPosts.clases, ...igPosts.kids]} /></Section>
  </>);
}
