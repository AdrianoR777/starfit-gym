import { requireUser, NotConfigured } from "@/lib/guard";
import { Empty } from "@/components/ui";
import { JoinQueue, ReportFailure } from "@/components/SmartForms";
import { queueAction } from "@/lib/smart-actions";

export const metadata = { title: "Máquinas" };
const label: Record<string, [string, string]> = {
  operational: ["Disponible", "text-lime"], in_use: ["En uso", "text-amber-300"], reserved: ["Reservada", "text-sky-300"],
  maintenance: ["En mantenimiento", "text-orange-400"], out_of_service: ["Fuera de servicio", "text-red-400"],
};
const ago = (d: string) => { const m = Math.round((Date.now() - +new Date(d)) / 60000); return m < 60 ? `hace ${m} min` : m < 1440 ? `hace ${Math.round(m / 60)} h` : `hace ${Math.round(m / 1440)} d`; };

export default async function Page() {
  const { sb, user } = await requireUser();
  if (!sb) return <NotConfigured />;
  const [{ data: eq }, { data: mine }] = await Promise.all([
    sb.from("equipment").select("id,code,name,category,status,status_source,status_updated_at,queue_enabled,instructions,gym_locations(name),training_zones(name)").order("name"),
    sb.from("equipment_queue").select("id,status,called_at,equipment_id,equipment(name,queue_confirm_minutes)").eq("user_id", user.id).in("status", ["waiting", "called", "confirmed"]),
  ]);
  const turn = mine?.[0]; const tEq = turn?.equipment as unknown as { name: string; queue_confirm_minutes: number } | undefined;
  return (
    <div className="space-y-8">
      <header><p className="eyebrow">Gimnasio inteligente</p><h1 className="display mt-2 text-5xl">Máquinas</h1>
        <p className="mt-2 text-sm text-mute">Estado actualizado por el personal (manual). La lectura automática requiere sensores o máquinas conectadas: integración pendiente.</p></header>
      {turn && (
        <section className={`card p-6 ${turn.status === "called" ? "border-lime" : ""}`} aria-live="polite">
          <p className="eyebrow">Tu turno</p><p className="mt-2 text-xl font-semibold">{tEq?.name}</p>
          <p className="text-mute">{turn.status === "waiting" ? "En espera. Te avisaremos cuando sea tu turno." : turn.status === "called" ? `¡Es tu turno! Confirma en ${tEq?.queue_confirm_minutes} min o se libera.` : "Confirmado: la máquina es tuya."}</p>
          <div className="mt-4 flex gap-3">
            {turn.status === "called" && <form action={queueAction}><input type="hidden" name="entry" value={turn.id} /><input type="hidden" name="op" value="confirm" /><button className="btn btn-lime">Confirmar</button></form>}
            <form action={queueAction}><input type="hidden" name="entry" value={turn.id} /><input type="hidden" name="op" value="leave" /><button className="btn btn-ghost">{turn.status === "confirmed" ? "Terminé" : "Cancelar turno"}</button></form>
          </div>
        </section>)}
      {eq?.length ? (
        <ul className="grid gap-4 md:grid-cols-2">{eq.map((e) => { const [l, c] = label[e.status] ?? ["Sin datos", "text-mute"]; const stale = Date.now() - +new Date(e.status_updated_at) > 12 * 3600e3; return (
          <li key={e.id} className="card p-6">
            <div className="flex items-start justify-between gap-4"><div><p className="font-semibold">{e.name}</p><p className="text-xs text-mute">{e.code} · {(e.gym_locations as unknown as { name: string })?.name}{e.training_zones ? ` · ${(e.training_zones as unknown as { name: string }).name}` : ""}</p></div>
              <span className={`text-sm font-semibold ${stale ? "text-mute" : c}`}>{stale ? "Sin datos actualizados" : l}</span></div>
            <p className="mt-2 text-xs text-mute">Actualizado {ago(e.status_updated_at)} · {e.status_source === "manual" ? "por el personal" : e.status_source}</p>
            {e.instructions && <details className="mt-3 text-sm"><summary className="cursor-pointer text-mute hover:text-bone">Cómo usarla</summary><p className="mt-2 text-mute">{e.instructions}</p></details>}
            <div className="mt-4 flex flex-wrap items-start gap-3">{e.queue_enabled && !turn && e.status !== "maintenance" && e.status !== "out_of_service" && <JoinQueue id={e.id} />}</div>
            <ReportFailure id={e.id} />
          </li>); })}</ul>
      ) : <Empty title="Aún no hay máquinas registradas">Pronto podrás ver aquí el estado de las máquinas de tu sede.</Empty>}
    </div>
  );
}
