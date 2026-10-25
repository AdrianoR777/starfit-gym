import Link from "next/link";
import { requireStaff, NotConfigured } from "@/lib/guard";
import { Empty } from "@/components/ui";
export const metadata = { title: "Panel del entrenador" };
export default async function Page() {
  const { sb } = await requireStaff(["trainer", "owner", "admin"]);
  if (!sb) return <NotConfigured />;
  const { data: tid } = await sb.rpc("my_trainer_id");
  if (!tid) return <Empty title="Tu cuenta de personal no tiene perfil de entrenador">Pide a un administrador que lo cree.</Empty>;
  const since = new Date(Date.now() - 7 * 864e5).toISOString();
  const [{ data: members }, { data: pending }, { data: next }] = await Promise.all([
    sb.from("trainer_assignments").select("member_id, profiles:member_id(full_name)").eq("trainer_id", tid),
    sb.from("workout_plans").select("id,member_id,name,source,status").eq("trainer_id", tid).in("status", ["proposed", "draft"]),
    sb.from("class_schedules").select("id,starts_at,capacity,booked,classes(name)").eq("trainer_id", tid).gte("starts_at", new Date().toISOString()).order("starts_at").limit(5),
  ]);
  const ids = (members ?? []).map((m) => m.member_id);
  const { data: logs } = ids.length ? await sb.from("workout_logs").select("member_id").in("member_id", ids).gte("logged_at", since) : { data: [] };
  const count = (id: string) => (logs ?? []).filter((l) => l.member_id === id).length;
  return (<div className="space-y-10">
    <h1 className="display text-5xl">Hola, coach</h1>
    <section><h2 className="mb-3 font-semibold">Pendientes de revisión ({pending?.length ?? 0})</h2>
      {pending?.length ? <ul className="space-y-2">{pending.map((p) => <li key={p.id} className="card flex justify-between p-4"><span>{p.name} · <span className="text-mute">{p.source === "ai" ? "propuesto por IA" : "borrador"}</span></span><Link className="text-lime underline" href={`/entrenador/socio/${p.member_id}`}>Revisar</Link></li>)}</ul> : <p className="text-mute">Nada pendiente.</p>}</section>
    <section><h2 className="mb-3 font-semibold">Mis socios ({members?.length ?? 0})</h2>
      {members?.length ? <ul className="grid gap-3 md:grid-cols-2">{members.map((m) => (
        <li key={m.member_id}><Link href={`/entrenador/socio/${m.member_id}`} className="card flex items-center justify-between p-5 hover:border-lime">
          <span className="font-semibold">{(m.profiles as unknown as { full_name: string | null })?.full_name ?? "Socio"}</span><span className="text-sm text-mute">{count(m.member_id)} sesiones en 7 días</span></Link></li>))}</ul>
        : <Empty title="Aún no tienes socios asignados" />}</section>
    <section><h2 className="mb-3 font-semibold">Mis próximas clases</h2>
      {next?.length ? <ul className="space-y-2">{next.map((c) => <li key={c.id} className="card flex justify-between p-4"><span>{(c.classes as unknown as { name: string })?.name} · {new Date(c.starts_at).toLocaleString("es-PE", { timeZone: "America/Lima", dateStyle: "medium", timeStyle: "short" })}</span><span className="text-mute">{c.booked}/{c.capacity}</span></li>)}</ul> : <p className="text-mute">Sin clases asignadas.</p>}</section>
  </div>);
}
