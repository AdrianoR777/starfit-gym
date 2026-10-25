import { supabaseServer } from "@/lib/supabase/server";
import { Empty } from "./ui";
export async function Schedule({ bookable = false }: { bookable?: boolean }) {
  const sb = await supabaseServer();
  if (!sb) return <Empty title="Horarios no disponibles">Base de datos no configurada.</Empty>;
  const { data } = await sb.from("class_schedules").select("id,starts_at,ends_at,capacity,booked,classes(name,kind)")
    .eq("cancelled", false).gte("starts_at", new Date().toISOString()).order("starts_at").limit(60);
  if (!data?.length) return <Empty title="Sin clases programadas">Los horarios se publicarán aquí.</Empty>;
  const fmt = (d: string, o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("es-PE", { timeZone: "America/Lima", ...o }).format(new Date(d));
  return (
    <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line">
      {data.map((s) => { const c = s.classes as unknown as { name: string; kind: string }; const left = s.capacity - s.booked; return (
        <li key={s.id} className="flex flex-wrap items-center gap-4 bg-graphite px-5 py-4">
          <div className="w-36"><p className="font-semibold capitalize">{fmt(s.starts_at, { weekday: "short", day: "numeric", month: "short" })}</p><p className="text-sm text-mute">{fmt(s.starts_at, { timeStyle: "short" })}–{fmt(s.ends_at, { timeStyle: "short" })}</p></div>
          <div className="flex-1"><p className="font-semibold">{c?.name}</p><p className="text-sm text-mute">{c?.kind}</p></div>
          <p className={`text-sm ${left > 0 ? "text-lime" : "text-mute"}`}>{left > 0 ? `${left} cupos` : "Lleno · lista de espera"}</p>
          {bookable && <form action={`/portal/reservas/book`} method="post"><input type="hidden" name="id" value={s.id} /><button className="btn btn-lime !py-2 text-sm">{left > 0 ? "Reservar" : "Unirme a espera"}</button></form>}
        </li> ); })}
    </ul>
  );
}
