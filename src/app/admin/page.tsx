import { requireStaff, NotConfigured } from "@/lib/guard";
import { formatPEN } from "@/lib/config";
export const metadata = { title: "Administración" };
export default async function Page({ searchParams }: { searchParams: Promise<{ from?: string; to?: string; loc?: string }> }) {
  const { sb } = await requireStaff(["owner", "admin"]);
  if (!sb) return <main className="p-8"><NotConfigured /></main>;
  const sp = await searchParams;
  const to = sp.to ?? new Date().toISOString().slice(0, 10);
  const from = sp.from ?? new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10);
  const range = [`${from}T00:00:00-05:00`, `${to}T23:59:59-05:00`] as const;
  const { data: locations } = await sb.from("gym_locations").select("id,name");
  const byLoc = <T,>(q: T) => q; // filtro por sede aplicado abajo cuando corresponde
  const ms = sb.from("memberships").select("*", { count: "exact", head: true });
  const [active, created, cancelled, paid, pending, checks, books, eq] = await Promise.all([
    byLoc(sp.loc ? ms.eq("location_id", sp.loc) : ms).eq("status", "active"),
    sb.from("memberships").select("*", { count: "exact", head: true }).gte("created_at", range[0]).lte("created_at", range[1]),
    sb.from("memberships").select("*", { count: "exact", head: true }).eq("status", "cancelled").gte("created_at", range[0]).lte("created_at", range[1]),
    sb.from("payments").select("amount_cents").eq("status", "paid").gte("paid_at", range[0]).lte("paid_at", range[1]),
    sb.from("payments").select("*", { count: "exact", head: true }).eq("status", "pending"),
    (sp.loc ? sb.from("checkins").select("*", { count: "exact", head: true }).eq("location_id", sp.loc) : sb.from("checkins").select("*", { count: "exact", head: true })).gte("checked_in_at", range[0]).lte("checked_in_at", range[1]),
    sb.from("bookings").select("*", { count: "exact", head: true }).gte("created_at", range[0]).lte("created_at", range[1]),
    sb.from("equipment").select("*", { count: "exact", head: true }).neq("status", "operational"),
  ]);
  const revenue = (paid.data ?? []).reduce((a, p) => a + p.amount_cents, 0);
  const kpis: [string, string][] = [
    ["Miembros activos", String(active.count ?? 0)], ["Nuevas inscripciones", String(created.count ?? 0)], ["Cancelaciones", String(cancelled.count ?? 0)],
    ["Ingresos confirmados", formatPEN(revenue)], ["Pagos pendientes", String(pending.count ?? 0)], ["Asistencias", String(checks.count ?? 0)],
    ["Reservas", String(books.count ?? 0)], ["Equipos fuera de servicio", String(eq.count ?? 0)],
  ];
  return (
    <main id="main" className="mx-auto max-w-7xl space-y-8 px-4 py-8 md:px-8">
      <h1 className="display text-5xl">Administración</h1>
      <form className="card flex flex-wrap items-end gap-4 p-4">
        <label><span className="text-xs text-mute">Desde</span><input type="date" name="from" defaultValue={from} className="field" /></label>
        <label><span className="text-xs text-mute">Hasta</span><input type="date" name="to" defaultValue={to} className="field" /></label>
        <label><span className="text-xs text-mute">Sede</span><select name="loc" defaultValue={sp.loc ?? ""} className="field"><option value="">Todas</option>{locations?.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</select></label>
        <button className="btn btn-lime">Aplicar</button>
      </form>
      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{kpis.map(([l, v]) => <div key={l} className="card p-6"><dt className="text-sm text-mute">{l}</dt><dd className="display mt-3 text-4xl">{v}</dd></div>)}</dl>
      <div className="card flex flex-wrap items-center gap-3 p-4"><span className="text-sm text-mute">Exportar CSV ({from} → {to}):</span>
        {["pagos", "membresias", "asistencias", "reservas", "incidencias"].map((t) => <a key={t} className="btn btn-ghost !py-2 text-sm" href={`/admin/export?tipo=${t}&desde=${from}&hasta=${to}`}>{t}</a>)}
        <a className="btn btn-lime !py-2 text-sm" href="/admin/equipos">Equipos e incidencias</a></div>
      <p className="text-xs text-mute">Todas las cifras provienen de registros confirmados en la base de datos. Ingresos = pagos con estado «paid»; no incluye proyecciones.</p>
    </main>
  );
}
