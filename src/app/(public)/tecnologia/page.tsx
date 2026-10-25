import Link from "next/link";
import { PageHero, Section } from "@/components/ui";
export const metadata = { title: "Tecnología" };
// Estado real de cada servicio digital. Ver docs/FEATURES.md
const items: [string, string, "Disponible" | "Próximamente" | "En camino", string?][] = [
  ["Ocupación por sede", "Aforo calculado con entradas y salidas registradas, horas tranquilas y mapa de calor semanal.", "Disponible", "/ocupacion"],
  ["Credencial digital con QR dinámico", "Código firmado que cambia cada 30 s y solo sirve una vez.", "Disponible", "/portal/credencial"],
  ["Reservas de clases con lista de espera", "Cupos controlados en la base de datos: nunca se sobrevende una clase.", "Disponible", "/horarios"],
  ["Estado de máquinas y turnos virtuales", "Consulta qué máquinas están disponibles, pide turno y reporta fallas.", "Disponible", "/portal/maquinas"],
  ["Rutinas y registro de entrenamiento", "Planes creados por tu entrenador y registro de cada sesión.", "Disponible", "/portal/entrenamientos"],
  ["Pago en línea", "Paga tu membresía con tarjeta o Yape desde la web.", "Próximamente"],
  ["Entrenador con IA", "Propuestas de rutina revisadas por un entrenador humano.", "En camino"],
  ["Máquinas conectadas y sensores", "Lectura automática del estado de cada máquina.", "En camino"],
  ["Wearables", "Importación voluntaria de actividad desde servicios autorizados.", "En camino"],
  ["Tour 3D", "Recorre nuestras sedes desde tu celular.", "En camino"],
];
const tone = { "Disponible": "text-lime border-lime/40", "Próximamente": "text-amber-300 border-amber-300/40", "En camino": "text-mute border-line" };
export default function Page() {
  return (<>
    <PageHero media={{ video: "/media/video/strength.mp4" }} eyebrow="Tecnología" title="Gimnasio" accent="conectado">Herramientas digitales para entrenar mejor. Indicamos con claridad qué ya funciona y qué está en camino.</PageHero>
    <Section><ul className="divide-y divide-line border-y border-line">{items.map(([t, d, st, href]) => (
      <li key={t} data-reveal className="grid gap-3 py-6 md:grid-cols-[1fr_2fr_auto] md:items-center">
        <h2 className="display text-2xl">{t}</h2><p className="text-mute">{d}</p>
        <div className="flex items-center gap-3"><span className={`rounded-full border px-3 py-1 text-xs ${tone[st]}`}>{st}</span>{href && <Link href={href} className="btn btn-ghost !py-2 text-sm">Abrir</Link>}</div>
      </li>))}</ul></Section>
  </>);
}
