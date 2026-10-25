import { requireStaff, NotConfigured } from "@/lib/guard";
import { setEquipmentStatus, updateTicket } from "@/lib/smart-actions";
export const metadata = { title: "Equipos y mantenimiento" };
const statuses = [["operational", "Disponible"], ["in_use", "En uso"], ["reserved", "Reservada"], ["maintenance", "Mantenimiento"], ["out_of_service", "Fuera de servicio"]] as const;

export default async function Page() {
  const { sb } = await requireStaff(["owner", "admin", "reception", "trainer"]);
  if (!sb) return <main className="p-8"><NotConfigured /></main>;
  const [{ data: eq }, { data: tickets }] = await Promise.all([
    sb.from("equipment").select("id,code,name,status,status_updated_at,next_inspection_on,gym_locations(name)").order("name"),
    sb.from("maintenance_tickets").select("id,description,priority,status,assigned_to,created_at,equipment(name,code)").neq("status", "resolved").order("created_at", { ascending: false }).limit(50),
  ]);
  const today = new Date().toISOString().slice(0, 10);
  return (
    <main id="main" className="mx-auto max-w-7xl space-y-10 px-4 py-8 md:px-8">
      <h1 className="display text-5xl">Equipos</h1>
      <section><h2 className="mb-3 font-semibold">Incidencias abiertas ({tickets?.length ?? 0})</h2>
        {tickets?.length ? <ul className="space-y-2">{tickets.map((t) => { const e = t.equipment as unknown as { name: string; code: string }; return (
          <li key={t.id} className="card flex flex-wrap items-center gap-4 p-4">
            <div className="min-w-0 flex-1"><p className="font-semibold">{e?.name} <span className="text-xs text-mute">{e?.code}</span></p><p className="text-sm text-mute">{t.description}</p></div>
            <form action={updateTicket} className="flex flex-wrap gap-2"><input type="hidden" name="id" value={t.id} />
              <input name="assigned_to" defaultValue={t.assigned_to ?? ""} placeholder="Técnico" className="field !w-36 !py-2 text-sm" aria-label="Técnico asignado" />
              <select name="status" defaultValue={t.status} className="field !w-40 !py-2 text-sm" aria-label="Estado"><option value="open">Abierta</option><option value="assigned">Asignada</option><option value="in_progress">En reparación</option><option value="resolved">Resuelta</option><option value="rejected">Rechazada</option></select>
              <button className="btn btn-ghost !py-2 text-sm">Guardar</button></form>
          </li>); })}</ul> : <p className="text-mute">Sin incidencias abiertas.</p>}
      </section>
      <section><h2 className="mb-3 font-semibold">Estado de máquinas</h2>
        <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="text-left text-mute"><tr><th className="py-2">Máquina</th><th>Sede</th><th>Próx. inspección</th><th>Estado</th></tr></thead>
          <tbody className="divide-y divide-line">{eq?.map((e) => (
            <tr key={e.id}><td className="py-3"><p className="font-semibold">{e.name}</p><p className="text-xs text-mute">{e.code}</p></td>
              <td>{(e.gym_locations as unknown as { name: string })?.name}</td>
              <td className={e.next_inspection_on && e.next_inspection_on < today ? "text-red-400" : ""}>{e.next_inspection_on ?? "—"}</td>
              <td><form action={setEquipmentStatus} className="flex gap-2"><input type="hidden" name="id" value={e.id} />
                <select name="status" defaultValue={e.status} className="field !w-44 !py-2 text-sm" aria-label={`Estado de ${e.name}`}>{statuses.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
                <button className="btn btn-lime !py-2 text-sm">Actualizar</button></form></td></tr>))}</tbody></table></div>
        {!eq?.length && <p className="text-mute">Sin equipos. Cárgalos en la tabla <code>equipment</code> (CMS de inventario pendiente).</p>}
      </section>
    </main>
  );
}
