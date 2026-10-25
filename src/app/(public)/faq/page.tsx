import { PageHero, Section } from "@/components/ui";
export const metadata = { title: "Preguntas frecuentes" };
const faqs = [
  ["¿Dónde están ubicados?", "Tenemos dos sedes en Nuevo Chimbote: Sede Pardo (Cruce de Ppao, WhatsApp 993 538 789) y Sede Agraria (Av. Naciones Unidas con Agraria, WhatsApp 920 373 854)."],
  ["¿Qué clases grupales hay?", "Baile, Funcional, Xbox, Zumba y Step. También tenemos el Taller Functional Kids para niños."],
  ["¿Cuál es el horario?", "Horario extendido de 6:00 a. m. a 10:30 p. m. Confirma domingos y feriados por WhatsApp."],
  ["¿Cuánto cuesta la membresía?", "Solicita los precios vigentes por WhatsApp o en bit.ly/inscripstarfit."],
  ["¿Cómo me inscribo?", "Crea tu cuenta, elige un plan, acepta las condiciones y paga en línea o en recepción. La membresía se activa cuando el pago es confirmado por el sistema."],
  ["¿Se renueva automáticamente?", "No. Solo se renueva si lo autorizas expresamente."],
  ["¿Cómo ingreso al gimnasio?", "Con tu credencial digital: un QR temporal que cambia cada 30 segundos y se valida en recepción."],
  ["¿Puedo cancelar una reserva?", "Sí, desde tu portal. Si hay lista de espera, el cupo pasa a la siguiente persona."],
  ["¿Menores de edad?", "Requieren autorización de su madre, padre o tutor y supervisión profesional."],
  ["¿Qué hacen con mis datos?", "Los tratamos según la Ley N.° 29733. Puedes ejercer tus derechos ARCO desde tu perfil o en recepción."],
];
export default function Page() {
  const ld = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) };
  return (<><PageHero media={{ img: "/media/img/grip.webp" }} eyebrow="FAQ" title="Preguntas" accent="frecuentes" />
    <Section><div className="divide-y divide-line border-y border-line">{faqs.map(([q, a]) => (
      <details key={q} className="group py-6"><summary className="cursor-pointer list-none text-xl font-semibold">{q}<span className="float-right text-lime group-open:rotate-45 transition">+</span></summary><p className="mt-3 max-w-3xl text-mute">{a}</p></details>))}</div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} /></Section></>);
}
