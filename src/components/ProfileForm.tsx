"use client";
import { useActionState } from "react";
import { updateProfile } from "@/lib/actions";
import { Msg } from "./AuthForms";
type P = { full_name: string | null; phone: string | null; stats_hidden: boolean; notify_email: boolean; notify_whatsapp: boolean };
export default function ProfileForm({ p }: { p: P }) {
  const [s, act, pending] = useActionState(updateProfile, undefined);
  return (
    <form action={act} className="card space-y-4 p-6">
      <label className="block"><span className="text-sm text-mute">Nombre</span><input className="field mt-1" name="full_name" defaultValue={p.full_name ?? ""} /></label>
      <label className="block"><span className="text-sm text-mute">Celular</span><input className="field mt-1" name="phone" defaultValue={p.phone ?? ""} /></label>
      {([["stats_hidden", "Ocultar mis estadísticas", p.stats_hidden], ["notify_email", "Recibir correos", p.notify_email], ["notify_whatsapp", "Recibir WhatsApp (si está habilitado)", p.notify_whatsapp]] as const).map(([n, l, v]) => (
        <label key={n} className="flex items-center gap-3"><input type="checkbox" name={n} defaultChecked={v} className="size-5 accent-[#C9FF43]" />{l}</label>))}
      <Msg s={s} /><button disabled={pending} className="btn btn-lime">Guardar</button>
    </form>
  );
}
