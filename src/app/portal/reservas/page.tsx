import { requireUser, NotConfigured } from "@/lib/guard";
import { Schedule } from "@/components/Schedule";
import { cancelBooking } from "@/lib/actions";

const msg: Record<string, string> = { confirmed: "Reserva confirmada.", waitlisted: "Clase llena: estás en lista de espera.", already_booked: "Ya tenías esta reserva.", membership_required: "Necesitas una membresía activa.", class_started: "La clase ya empezó.", class_unavailable: "Clase no disponible." };

export default async function Page({ searchParams }: { searchParams: Promise<{ r?: string }> }) {
  const { sb, user } = await requireUser();
  if (!sb) return <NotConfigured />;
  const { r } = await searchParams;
  const { data: mine } = await sb.from("bookings").select("id, schedule_id, class_schedules(starts_at, classes(name))").eq("user_id", user.id).eq("status", "confirmed");
  return (
    <div className="space-y-8">
      <h1 className="display text-5xl">Reservas</h1>
      {r && <p role="status" className="card p-4">{msg[r] ?? r}</p>}
      <section><h2 className="mb-3 font-semibold">Mis reservas</h2>
        {mine?.length ? <ul className="space-y-2">{mine.map((b) => { const s = b.class_schedules as unknown as { starts_at: string; classes: { name: string } }; return (
          <li key={b.id} className="card flex items-center justify-between p-4"><span>{s.classes.name} · {new Date(s.starts_at).toLocaleString("es-PE", { timeZone: "America/Lima" })}</span>
            <form action={cancelBooking}><input type="hidden" name="id" value={b.schedule_id} /><button className="btn btn-ghost !py-2 text-sm">Cancelar</button></form></li>); })}</ul>
          : <p className="text-mute">No tienes reservas activas.</p>}
      </section>
      <section><h2 className="mb-3 font-semibold">Próximas clases</h2><Schedule bookable /></section>
    </div>
  );
}
