import { Empty, Gallery, PageHero, Section, VideoBand, stockNote } from "@/components/ui";
import ZoneMap from "@/components/ZoneMap";
import { supabaseServer } from "@/lib/supabase/server";
export const metadata = { title: "Instalaciones" };
export default async function Page() {
  const sb = await supabaseServer();
  const { data: zones } = sb ? await sb.from("training_zones").select("id,name,kind,description,rules,capacity,map_shape") : { data: null };
  return (<>
    <PageHero media={{ img: "/media/img/facility.webp", alt: "Sala de entrenamiento con máquinas" }} eyebrow="Instalaciones" title="El plano" accent="interactivo">Explora cada zona: equipamiento, normas y aforo. Solo se muestran espacios registrados por el gimnasio.</PageHero>
    <Section>{zones?.length ? <ZoneMap zones={zones} /> : <Empty title="Zonas aún no registradas">Muy pronto publicaremos el plano de nuestras sedes.</Empty>}</Section>
  <VideoBand src="/media/video/strength.mp4" title="Hierro" accent="y precisión" /><Section><Gallery items={[{ src: "/media/img/rack.webp", alt: "Zona de racks", caption: "Fuerza" },{ src: "/media/img/dumbbell-floor.webp", alt: "Mancuernas", caption: "Peso libre" },{ src: "/media/img/hall.webp", alt: "Sala amplia", caption: "Espacio" },{ src: "/media/img/dumbbells.webp", alt: "Mancuernas", caption: "Equipamiento" },{ src: "/media/img/row.webp", alt: "Remo con mancuerna", caption: "Entrenamiento" }]} /><p className="mt-4 text-xs text-mute">{stockNote}</p></Section></>);
}
