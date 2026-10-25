"use client";
import { useActionState } from "react";
import { membershipAction, savePrefs } from "@/lib/actions";
import { Msg } from "./AuthForms";

export function MembershipControls({ id, status, maxPause, used, policy, pausedUntil }: { id: string; status: string; maxPause: number; used: number; policy: string; pausedUntil: string | null }) {
  const [s, act, pending] = useActionState(membershipAction, undefined);
  const left = maxPause - used;
  return (
    <div className="space-y-4">
      {status === "active" && left > 0 && (
        <form action={act} className="flex flex-wrap items-end gap-3"><input type="hidden" name="id" value={id} /><input type="hidden" name="op" value="pause" />
          <label className="block"><span className="text-sm text-mute">Pausar (te quedan {left} días)</span><input id="m-days" name="days" type="number" min={1} max={left} defaultValue={Math.min(7, left)} className="field mt-1 !w-28" /></label>
          <button disabled={pending} className="btn btn-ghost">Pausar membresía</button></form>)}
      {status === "suspended" && <form action={act}><input type="hidden" name="id" value={id} /><input type="hidden" name="op" value="resume" /><p className="mb-2 text-sm text-mute">Pausada hasta el {pausedUntil}.</p><button disabled={pending} className="btn btn-lime">Reactivar ahora</button></form>}
      <details className="text-sm"><summary className="cursor-pointer text-mute hover:text-bone">Cancelar membresía</summary>
        <form action={act} className="mt-3 space-y-3"><input type="hidden" name="id" value={id} /><input type="hidden" name="op" value="cancel" />
          <p className="text-mute">{policy}</p>
          <label className="flex gap-3"><input type="checkbox" name="confirm" className="mt-1 accent-[#C9FF43]" />Entiendo y quiero cancelar.</label>
          <button disabled={pending} className="btn btn-ghost">Confirmar cancelación</button></form></details>
      <Msg s={s} />
    </div>);
}

type Prefs = Record<string, boolean | number>;
const groups: [string, [string, string][]][] = [
  ["Qué quiero recibir", [["bookings", "Reservas y lista de espera"], ["payments", "Pagos"], ["memberships", "Vencimiento de membresía"], ["schedule_changes", "Cambios de horario y cancelaciones"], ["queue", "Turnos de máquinas"], ["announcements", "Comunicados importantes"], ["maintenance", "Mantenimiento de instalaciones"]]],
  ["Por dónde", [["channel_email", "Correo"], ["channel_whatsapp", "WhatsApp (cuando esté habilitado)"], ["channel_push", "Notificaciones del navegador"]]],
];
export function PrefsForm({ p }: { p: Prefs }) {
  const [s, act, pending] = useActionState(savePrefs, undefined);
  const askPush = async (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.checked && "Notification" in window && Notification.permission === "default") { if ((await Notification.requestPermission()) !== "granted") e.target.checked = false; } };
  return (
    <form action={act} className="card space-y-6 p-6">
      {groups.map(([title, items]) => (<fieldset key={title}><legend className="mb-3 font-semibold">{title}</legend><div className="grid gap-2 sm:grid-cols-2">
        {items.map(([k, l]) => <label key={k} className="flex items-center gap-3"><input type="checkbox" name={k} defaultChecked={Boolean(p[k])} onChange={k === "channel_push" ? askPush : undefined} className="size-5 accent-[#C9FF43]" />{l}</label>)}</div></fieldset>))}
      <label className="block"><span className="text-sm text-mute">Máximo de avisos por día</span><input id="n-max" name="max_per_day" type="number" min={1} max={20} defaultValue={Number(p.max_per_day ?? 5)} className="field mt-1 !w-28" /></label>
      <div className="flex items-center gap-4"><button disabled={pending} className="btn btn-lime">{pending ? "Guardando…" : "Guardar preferencias"}</button><Msg s={s} /></div>
    </form>);
}
