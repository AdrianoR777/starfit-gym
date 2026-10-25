import { Empty, PageHero, Section } from "@/components/ui";
export const metadata = { title: "Blog" };
export default function Page() {
  return (<><PageHero media={{ img: "/media/img/core.webp" }} eyebrow="Blog" title="Aprende" accent="a entrenar">Técnica, descanso y hábitos. Contenido revisado por profesionales.</PageHero><Section><Empty title="Aún no hay artículos" cta={["/contacto", "Consultar"]}>Pronto publicaremos consejos de técnica, descanso y hábitos.</Empty></Section></>);
}
