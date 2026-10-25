import { requireStaff, NotConfigured } from "@/lib/guard";
import ReceptionScanner from "@/components/ReceptionScanner";
import { closeStaleCheckins } from "@/lib/smart-actions";
export const metadata = { title: "Recepción" };
export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { sb } = await requireStaff(["owner", "admin", "reception"]);
  if (!sb) return <main className="p-8"><NotConfigured /></main>;
  const { q } = await searchParams;
  const { data: locations } = await sb.from("gym_locations").select("id,name");
  const term = q?.trim().replace(/[%,()]/g, "");
  const { data: found } = term ? await sb.from("profiles").select("id,full_name,phone,document_id,memberships(status,ends_on)").or(`full_name.ilike.%${term}%,phone.ilike.%${term}%,document_id.eq.${term}`).limit(20) : { data: null };
  return (
    <main id="main" className="mx-auto max-w-7xl space-y-8 px-4 py-8 md:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4"><h1 className="display text-5xl">Recepción</h1>
        <form action={closeStaleCheckins}><button className="btn btn-ghost text-sm" title="Cierra entradas de días anteriores que no registraron salida">Corregir registros sin salida</button></form></div>
      <ReceptionScanner locations={locations ?? []} />
      <section className="card p-6">
        <form className="flex gap-3"><input name="q" defaultValue={q} placeholder="Buscar por nombre, celular o DNI" className="field text-lg" /><button className="btn btn-lime">Buscar</button></form>
        {found && <ul className="mt-4 divide-y divide-line">{found.map((p) => { const ms = (p.memberships as { status: string; ends_on: string | null }[]).find((m) => m.status === "active"); return (
          <li key={p.id} className="flex justify-between py-3"><span>{p.full_name} <span className="text-mute">{p.phone}</span></span><span className={ms ? "text-lime" : "text-mute"}>{ms ? `Activa hasta ${ms.ends_on ?? "—"}` : "Sin membresía activa"}</span></li>); })}</ul>}
      </section>
    </main>
  );
}
