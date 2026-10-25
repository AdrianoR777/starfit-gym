import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff, NotConfigured } from "@/lib/guard";
import PlanEditor from "@/components/PlanEditor";
import { reviewPlan } from "@/lib/trainer-actions";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { sb } = await requireStaff(["trainer", "owner", "admin"]);
  if (!sb) return <NotConfigured />;
  // RLS: si no está asignado, no devuelve el perfil
  const { data: prof } = await sb.from("profiles").select("full_name,goals").eq("id", id).maybeSingle();
  if (!prof) notFound();
  const [{ data: plans }, { data: logs }] = await Promise.all([
    sb.from("workout_plans").select("id,name,items,status,source,updated_at").eq("member_id", id).order("updated_at", { ascending: false }),
    sb.from("workout_logs").select("id,logged_at,perceived_effort,completed_items,notes").eq("member_id", id).order("logged_at", { ascending: false }).limit(15),
  ]);
  const current = plans?.find((p) => p.status !== "rejected");
  return (<div className="space-y-10">
    <Link href="/entrenador" className="text-sm text-mute hover:text-bone">← Mis socios</Link>
    <header><h1 className="display text-5xl">{prof.full_name ?? "Socio"}</h1>{prof.goals?.length > 0 && <p className="mt-2 text-mute">Objetivos: {prof.goals.join(" · ")}</p>}</header>
    {plans?.filter((p) => p.status === "proposed").map((p) => (
      <section key={p.id} className="card border-amber-400/50 p-6"><p className="eyebrow">{p.source === "ai" ? "Propuesta de IA" : "Propuesta"}</p><p className="mt-2 font-semibold">{p.name}</p>
        <ul className="mt-2 text-sm text-mute">{(p.items as { name: string; sets: number; reps: string }[]).map((it, i) => <li key={i}>{it.name} · {it.sets}×{it.reps}</li>)}</ul>
        <div className="mt-4 flex gap-3">{(["approve", "reject"] as const).map((d) => <form key={d} action={reviewPlan}><input type="hidden" name="plan" value={p.id} /><input type="hidden" name="member" value={id} /><input type="hidden" name="decision" value={d} /><button className={`btn ${d === "approve" ? "btn-lime" : "btn-ghost"}`}>{d === "approve" ? "Aprobar" : "Rechazar"}</button></form>)}</div>
      </section>))}
    <section><h2 className="mb-3 font-semibold">{current ? `Editar plan (${current.status === "approved" ? "publicado" : "borrador"})` : "Crear plan"}</h2>
      <PlanEditor member={id} plan={current ? { id: current.id, name: current.name, items: current.items as never } : undefined} /></section>
    <section><h2 className="mb-3 font-semibold">Sesiones registradas</h2>
      {logs?.length ? <ul className="space-y-2">{logs.map((l) => <li key={l.id} className="card p-4 text-sm">{new Date(l.logged_at).toLocaleDateString("es-PE", { timeZone: "America/Lima" })} · {(l.completed_items as string[]).length} ejercicios · esfuerzo {l.perceived_effort ?? "–"}/10{l.notes && <p className="mt-1 text-mute">“{l.notes}”</p>}</li>)}</ul> : <p className="text-mute">Aún no registra sesiones.</p>}</section>
  </div>);
}
