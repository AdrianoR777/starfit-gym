import { PageHero, Section, Empty } from "@/components/ui";
import { Heatmap } from "@/components/Heatmap";
import { AutoRefresh } from "@/components/AutoRefresh";
import { supabaseServer } from "@/lib/supabase/server";
import { buildForecast, quietestHours, occupancyLevel } from "@/lib/forecast";

export const metadata = { title: "Ocupación" };
export const dynamic = "force-dynamic";
const PERIOD = 56;
const dayName = (d: number) => ["", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"][d];

export default async function Page() {
  const sb = await supabaseServer();
  const { data: locs } = sb ? await sb.from("gym_locations").select("id,name,capacity").order("name") : { data: null };
  const todayDow = ((new Date(new Date().toLocaleString("en-US", { timeZone: "America/Lima" })).getDay() + 6) % 7) + 1;
  const items = await Promise.all((locs ?? []).map(async (l) => {
    const [{ data: live }, { data: hist }] = await Promise.all([
      sb!.rpc("live_occupancy", { p_location: l.id }).single<{ inside: number; capacity: number | null; last_event: string | null; source: string }>(),
      sb!.rpc("occupancy_history", { p_location: l.id, p_days: PERIOD }),
    ]);
    const forecast = buildForecast(hist ?? [], PERIOD);
    const fresh = live?.last_event && Date.now() - +new Date(live.last_event) < 3 * 3600e3;
    return { l, live, forecast, fresh };
  }));
  return (<>
    <AutoRefresh seconds={60} />
    <PageHero media={{ img: "/media/img/facility.webp" }} eyebrow="Ocupación" title="¿Cuánta gente" accent="hay ahora?">Aforo por sede calculado con las entradas y salidas registradas. Solo mostramos totales: nunca quién está dentro.</PageHero>
    <Section>
      {!items.length && <Empty title="Ocupación no disponible">La base de datos o las sedes aún no están configuradas.</Empty>}
      <div className="space-y-10">{items.map(({ l, live, forecast, fresh }) => {
        const lvl = occupancyLevel(live?.inside ?? 0, live?.capacity ?? null);
        const quiet = quietestHours(forecast, todayDow);
        return (
          <article key={l.id} data-reveal className="card overflow-hidden">
            <div className="grid gap-6 p-8 md:grid-cols-[1fr_2fr]">
              <div>
                <p className="eyebrow">{l.name}</p>
                {fresh ? (<>
                  <p className="display mt-4 text-7xl">{live!.inside}<span className="text-2xl text-mute"> / {live!.capacity ?? "—"}</span></p>
                  <p className="mt-2 text-lime">{lvl.label}{lvl.pct !== null && ` · ${lvl.pct}%`}</p>
                  {lvl.pct !== null && <div className="mt-4 h-2 overflow-hidden rounded-full bg-line"><div className="h-full bg-lime" style={{ width: `${lvl.pct}%` }} /></div>}
                  <p className="mt-4 text-xs text-mute">Actualizado {new Date(live!.last_event!).toLocaleTimeString("es-PE", { timeZone: "America/Lima", timeStyle: "short" })} · fuente: {live!.source === "access_control" ? "control de accesos" : "QR en recepción"}</p>
                </>) : (<>
                  <p className="display mt-4 text-3xl text-mute">Datos en vivo no disponibles</p>
                  <p className="mt-2 text-sm text-mute">No hay registros de acceso recientes para esta sede.</p>
                </>)}
                {quiet.length > 0 && <p className="mt-6 text-sm">Horas más tranquilas hoy ({dayName(todayDow)}): <strong className="text-lime">{quiet.map((q) => `${q.hour}:00`).join(" · ")}</strong></p>}
              </div>
              <div>{forecast.ok ? <Heatmap forecast={forecast} /> : <p className="text-mute">Aún no hay historial suficiente para estimar horarios concurridos ({forecast.totalVisits} entradas registradas; se necesitan al menos 50).</p>}</div>
            </div>
          </article>);
      })}</div>
    </Section>
  </>);
}
