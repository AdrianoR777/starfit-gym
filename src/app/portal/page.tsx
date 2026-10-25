import Link from "next/link";
import { requireUser, NotConfigured } from "@/lib/guard";
import { Empty } from "@/components/ui";

const fmt = (d: string) => new Intl.DateTimeFormat("es-PE", { timeZone: "America/Lima", weekday: "long", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(d));

export default async function Dashboard() {
  const { sb, user } = await requireUser();
  if (!sb) return <NotConfigured />;
  const since = new Date(Date.now() - 56 * 864e5).toISOString();
  const [{ data: prof }, { data: ms }, { data: next }, { data: visits }, { data: notes }, { data: pays }] = await Promise.all([
    sb.from("profiles").select("full_name, stats_hidden").eq("id", user.id).single(),
    sb.from("memberships").select("status, ends_on, sessions_remaining, membership_plans(name)").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1),
    sb.from("bookings").select("class_schedules!inner(starts_at, classes(name))").eq("user_id", user.id).eq("status", "confirmed").gte("class_schedules.starts_at", new Date().toISOString()).limit(1),
    sb.from("checkins").select("checked_in_at").eq("user_id", user.id).gte("checked_in_at", since),
    sb.from("notifications").select("id,title,created_at").eq("user_id", user.id).is("read_at", null).order("created_at", { ascending: false }).limit(5),
    sb.from("payments").select("status").eq("user_id", user.id).eq("status", "pending"),
  ]);
  const m = ms?.[0]; const plan = m?.membership_plans as unknown as { name: string } | undefined;
  const nb = next?.[0]?.class_schedules as unknown as { starts_at: string; classes: { name: string } } | undefined;
  // constancia: visitas por semana (últimas 8)
  const weeks = Array.from({ length: 8 }, (_, i) => (visits ?? []).filter((v) => { const age = (Date.now() - +new Date(v.checked_in_at)) / 864e5; return age >= (7 - i) * 7 && age < (8 - i) * 7; }).length);
  const max = Math.max(1, ...weeks);

  return (
    <div className="space-y-6">
      <header><p className="eyebrow">Tu portal</p><h1 className="display mt-2 text-5xl">Hola, {prof?.full_name?.split(" ")[0] ?? "miembro"}</h1></header>
      <div className="grid gap-4 md:grid-cols-3">
        <section className="card p-6 md:col-span-2">
          <p className="eyebrow">Membresía</p>
          {m ? (<><p className="display mt-3 text-3xl">{plan?.name}</p>
            <p className={`mt-2 text-sm ${m.status === "active" ? "text-lime" : "text-amber-300"}`}>{({ active: "Activa", pending_payment: "Pago pendiente", suspended: "Suspendida", expired: "Vencida", cancelled: "Cancelada" } as Record<string, string>)[m.status]}{m.ends_on && ` · vence ${m.ends_on}`}</p></>)
            : <Empty title="Sin membresía" cta={["/membresias", "Ver planes"]} />}
          {!!pays?.length && <p className="mt-3 text-sm text-amber-300">Tienes {pays.length} pago(s) pendiente(s).</p>}
        </section>
        <Link href="/portal/credencial" className="card flex flex-col justify-between !bg-lime !border-lime p-6 text-ink"><p className="eyebrow !text-ink/60">Acceso</p><p className="display text-3xl">Abrir QR</p></Link>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <section className="card p-6"><p className="eyebrow">Próxima clase</p>{nb ? <><p className="mt-3 text-xl font-semibold">{nb.classes.name}</p><p className="capitalize text-mute">{fmt(nb.starts_at)}</p></> : <p className="mt-3 text-mute">Sin reservas. <Link className="underline" href="/portal/reservas">Reservar</Link></p>}</section>
        <section className="card p-6"><p className="eyebrow">Notificaciones</p>{notes?.length ? <ul className="mt-3 space-y-2">{notes.map((n) => <li key={n.id} className="text-sm">{n.title}</li>)}</ul> : <p className="mt-3 text-mute">Todo al día.</p>}</section>
      </div>
      {!prof?.stats_hidden && (
        <section className="card p-6">
          <p className="eyebrow">Constancia · visitas por semana (8 semanas)</p>
          <div className="mt-6 flex h-32 items-end gap-2" role="img" aria-label={`Visitas semanales: ${weeks.join(", ")}`}>
            {weeks.map((w, i) => <div key={i} className="flex flex-1 flex-col items-center gap-1"><span className="text-xs text-mute">{w}</span><div className="w-full rounded-md bg-lime" style={{ height: `${(w / max) * 100}%`, minHeight: 2, opacity: w ? 1 : 0.2 }} /></div>)}
          </div>
          <p className="mt-4 text-xs text-mute">El descanso es parte del progreso: 2–5 visitas semanales es un rango saludable para la mayoría. Consulta a tu entrenador.</p>
        </section>
      )}
    </div>
  );
}
