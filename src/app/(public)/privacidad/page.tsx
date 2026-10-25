import { PageHero, Section } from "@/components/ui";
export const metadata = { title: "Privacidad" };
export default function Page() {
  return (<><PageHero media={{ img: "/media/img/rack.webp" }} eyebrow="Legal" title="Privacidad">Borrador base. Debe ser revisado por un profesional legal antes de su publicación.</PageHero>
    <Section><div className="max-w-3xl space-y-4 text-mute">
      <p>Tratamos tus datos personales conforme a la Ley N.° 29733 y su Reglamento (D.S. 016-2024-JUS) para gestionar tu membresía, reservas, pagos y acceso.</p>
      <p>Los datos de actividad física o wearables solo se recopilan con tu consentimiento expreso y granular, y puedes revocarlo en cualquier momento.</p>
      <p>No almacenamos datos completos de tarjetas: los pagos se procesan a través de la pasarela autorizada.</p>
      <p>Puedes ejercer tus derechos de acceso, rectificación, cancelación y oposición (ARCO) escribiendo a recepción.</p>
    </div></Section></>);
}
