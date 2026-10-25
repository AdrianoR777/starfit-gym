import { requireUser, NotConfigured } from "@/lib/guard";
import { PrefsForm } from "@/components/SelfService";
import { markAllRead } from "@/lib/actions";
export const metadata = { title: "Notificaciones" };
const defaults = { bookings: true, payments: true, memberships: true, schedule_changes: true, queue: true, announcements: true, maintenance: false, channel_email: true, channel_whatsapp: false, channel_push: false, max_per_day: 5 };
export default async function Page() {
  const { sb, user } = await requireUser();
  if (!sb) return <NotConfigured />;
  const [{ data: list }, { data: prefs }] = await Promise.all([
    sb.from("notifications").select("id,title,body,created_at,read_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50),
    sb.from("notification_preferences").select("*").eq("user_id", user.id).maybeSingle(),
  ]);
  const unread = list?.filter((n) => !n.read_at).length ?? 0;
  return (<div className="space-y-8">
    <div className="flex flex-wrap items-end justify-between gap-4"><h1 className="display text-5xl">Avisos {unread > 0 && <span className="text-2xl text-lime">{unread}</span>}</h1>
      {unread > 0 && <form action={markAllRead}><button className="btn btn-ghost text-sm">Marcar todo como leído</button></form>}</div>
    {list?.length ? <ul className="space-y-2">{list.map((n) => (
      <li key={n.id} className={`card p-4 ${n.read_at ? "opacity-60" : "border-lime/50"}`}><p className="font-semibold">{n.title}</p>{n.body && <p className="text-sm text-mute">{n.body}</p>}
        <p className="mt-1 text-xs text-mute">{new Date(n.created_at).toLocaleString("es-PE", { timeZone: "America/Lima", dateStyle: "medium", timeStyle: "short" })}</p></li>))}</ul>
      : <p className="text-mute">No tienes avisos.</p>}
    <section><h2 className="mb-3 font-semibold">Preferencias</h2><PrefsForm p={prefs ?? defaults} />
      <p className="mt-3 text-xs text-mute">Correo y WhatsApp se envían cuando el gimnasio active esos servicios (integración pendiente). Los avisos dentro de la web ya funcionan.</p></section>
  </div>);
}
