import { Gallery, PageHero, Section, stockNote } from "@/components/ui";
export const metadata = { title: "Servicios" };
export default function Page() {
  return (<><PageHero media={{ img: "/media/img/pushup.webp" }} eyebrow="Servicios" title="Más que" accent="pesas">Entrenamiento personalizado, evaluación funcional y acompañamiento.</PageHero><Section><div className="grid gap-4 md:grid-cols-5">{["Sala de máquinas y cardio", "Clases grupales: Baile, Funcional, Xbox, Zumba y Step", "Taller Functional Kids", "Eventos y retos para la comunidad", "Instructores en cada sede"].map((t, i) => (
      <div key={t} data-reveal className="card p-6"><span className="display text-4xl text-lime">0{i + 1}</span><p className="mt-4 text-lg font-semibold">{t}</p></div>))}</div>
      <p className="mt-4 text-xs text-mute">Fuente: publicaciones oficiales de @sstarfitgym (2026). Precios por WhatsApp.</p></Section><Section><Gallery items={[{ src: "/media/img/bench-coach.webp", alt: "Entrenamiento asistido", caption: "Personalizado" },{ src: "/media/img/pushup.webp", alt: "Evaluación funcional", caption: "Evaluación" },{ src: "/media/img/row.webp", alt: "Técnica", caption: "Técnica" }]} /><p className="mt-4 text-xs text-mute">{stockNote}</p></Section></>);
}
