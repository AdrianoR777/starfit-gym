import Link from "next/link";
import { requireStaff, NotConfigured } from "@/lib/guard";
export const metadata = { title: "Socios" };
const PAGE = 25;
const st: Record<string, string> = { active: "Activa", pending_payment: "Pago pendiente", suspended: "Pausada", expired: "Vencida", cancelled: "Cancelada" };
export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string; estado?: string; p?: string }> }) {
  const { sb } = await requireStaff(["owner", "admin", "reception"]);
  if (!sb) return <main className="p-8"><NotConfigured /></main>;
  const sp = await searchParams; const page = Math.max(0, Number(sp.p ?? 0) || 0);
  const term = sp.q?.trim().replace(/[%,()]/g, "");
  let q = sb.from("profiles").select("id,full_name,phone,created_at,memberships(status,ends_on,membership_plans(name))", { count: "exact" }).order("created_at", { ascending: false }).range(page * PAGE, page * PAGE + PAGE - 1);
  if (term) q = q.or(`full_name.ilike.%${term}%,phone.ilike.%${term}%`);
  const { data, count } = await q;
  const rows = (data ?? []).map((p) => { const ms = (p.memberships as unknown as { status: string; ends_on: string | null; membership_plans: { name: string } }[]); const cur = ms.find((m) => m.status === "active") ?? ms[0]; return { ...p, cur }; })
    .filter((r) => !sp.estado || r.cur?.status === sp.estado);
  const link = (o: Record<string, string | number>) => `?${new URLSearchParams({ ...(sp.q && { q: sp.q }), ...(sp.estado && { estado: sp.estado }), ...Object.fromEntries(Object.entries(o).map(([k, v]) => [k, String(v)])) })}`;
  return (<main id="main" className="mx-auto max-w-7xl space-y-6 px-4 py-8 md:px-8">
    <h1 className="display text-5xl">Socios <span className="text-2xl text-mute">{count ?? 0}</span></h1>
    <form className="card flex flex-wrap gap-3 p-4"><input name="q" defaultValue={sp.q} placeholder="Nombre o celular" className="field !w-72" aria-label="Buscar" />
      <select name="estado" defaultValue={sp.estado ?? ""} className="field !w-48" aria-label="Estado"><option value="">Todos</option>{Object.entries(st).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
      <button className="btn btn-lime">Filtrar</button></form>
    <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="text-left text-mute"><tr><th className="py-2">Socio</th><th>Celular</th><th>Plan</th><th>Estado</th><th>Vence</th></tr></thead>
      <tbody className="divide-y divide-line">{rows.map((r) => (<tr key={r.id}><td className="py-3 font-semibold">{r.full_name ?? "—"}</td><td>{r.phone ?? "—"}</td><td>{r.cur?.membership_plans?.name ?? "—"}</td>
        <td className={r.cur?.status === "active" ? "text-lime" : "text-mute"}>{r.cur ? st[r.cur.status] : "Sin membresía"}</td><td>{r.cur?.ends_on ?? "—"}</td></tr>))}</tbody></table></div>
    {!rows.length && <p className="text-mute">Sin resultados.</p>}
    <nav className="flex gap-3" aria-label="Paginación">{page > 0 && <Link className="btn btn-ghost" href={link({ p: page - 1 })}>← Anterior</Link>}{(count ?? 0) > (page + 1) * PAGE && <Link className="btn btn-ghost" href={link({ p: page + 1 })}>Siguiente →</Link>}</nav>
  </main>);
}
