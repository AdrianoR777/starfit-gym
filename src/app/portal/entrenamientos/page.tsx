import { requireUser, NotConfigured } from "@/lib/guard";
import { Empty } from "@/components/ui";
import WorkoutLog from "@/components/WorkoutLog";
export default async function Page() {
  const { sb, user } = await requireUser();
  if (!sb) return <NotConfigured />;
  const [{ data: plans }, { data: logs }] = await Promise.all([
    sb.from("workout_plans").select("id,name,items,reviewed_by_professional").eq("member_id", user.id).eq("active", true),
    sb.from("workout_logs").select("id,logged_at,perceived_effort,completed_items").eq("member_id", user.id).order("logged_at", { ascending: false }).limit(10),
  ]);
  return (
    <div className="space-y-8">
      <h1 className="display text-5xl">Rutina</h1>
      {plans?.length ? plans.map((p) => (
        <section key={p.id}><h2 className="mb-1 text-xl font-semibold">{p.name}</h2>
          <p className="mb-4 text-xs text-mute">{p.reviewed_by_professional ? "Revisado por un profesional" : "Pendiente de revisión profesional"}</p>
          <WorkoutLog planId={p.id} items={p.items as never} /></section>))
        : <Empty title="Aún no tienes rutina asignada">Tu entrenador la creará según tu experiencia y disponibilidad.</Empty>}
      <section><h2 className="mb-3 font-semibold">Historial</h2>
        {logs?.length ? <ul className="space-y-2">{logs.map((l) => <li key={l.id} className="card p-4 text-sm">{new Date(l.logged_at).toLocaleDateString("es-PE", { timeZone: "America/Lima" })} · {(l.completed_items as string[]).length} ejercicios · esfuerzo {l.perceived_effort ?? "–"}</li>)}</ul> : <p className="text-mute">Sin registros.</p>}</section>
    </div>
  );
}
