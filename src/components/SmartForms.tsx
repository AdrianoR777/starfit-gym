"use client";
import { useActionState } from "react";
import { joinQueue, reportFailure, sendContact } from "@/lib/smart-actions";
import { Msg } from "./AuthForms";
import { sedes } from "@/lib/config";

export function JoinQueue({ id }: { id: string }) {
  const [s, act, pending] = useActionState(joinQueue, undefined);
  return <form action={act}><input type="hidden" name="id" value={id} /><button disabled={pending} className="btn btn-lime !py-2 text-sm">{pending ? "…" : "Pedir turno"}</button><Msg s={s} /></form>;
}
export function ReportFailure({ id }: { id: string }) {
  const [s, act, pending] = useActionState(reportFailure, undefined);
  return (
    <details className="mt-3 text-sm"><summary className="cursor-pointer text-mute hover:text-bone">Reportar falla</summary>
      <form action={act} className="mt-2 space-y-2"><input type="hidden" name="equipment" value={id} />
        <textarea name="description" required minLength={5} maxLength={1000} rows={2} className="field" placeholder="¿Qué ocurre con la máquina?" aria-label="Descripción de la falla" />
        <button disabled={pending} className="btn btn-ghost !py-2 text-sm">{pending ? "Enviando…" : "Enviar reporte"}</button><Msg s={s} /></form></details>);
}
export function ContactForm() {
  const [s, act, pending] = useActionState(sendContact, undefined);
  return (
    <form action={act} className="card grid gap-4 p-8 md:grid-cols-2">
      <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <label className="block"><span className="text-sm text-mute">Nombre</span><input id="c-name" name="name" required className="field mt-1" autoComplete="name" /></label>
      <label className="block"><span className="text-sm text-mute">Celular o correo</span><input id="c-contact" name="contact" required className="field mt-1" /></label>
      <label className="block"><span className="text-sm text-mute">Tema</span><select id="c-topic" name="topic" className="field mt-1">
        <option value="membresia">Membresías y precios</option><option value="clases">Clases</option><option value="entrenador">Entrenador personal</option><option value="instalaciones">Instalaciones</option><option value="otro">Otro</option></select></label>
      <label className="block"><span className="text-sm text-mute">Sede</span><select id="c-sede" name="sede" className="field mt-1">{sedes.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
      <label className="block md:col-span-2"><span className="text-sm text-mute">Mensaje</span><textarea id="c-msg" name="message" required rows={4} maxLength={2000} className="field mt-1" /></label>
      <label className="flex gap-3 text-sm text-mute md:col-span-2"><input type="checkbox" name="consent" required className="mt-1 accent-[#C9FF43]" />Acepto que STARFIT use estos datos para responder mi consulta (Ley 29733).</label>
      <div className="md:col-span-2"><Msg s={s} /><button disabled={pending} className="btn btn-lime mt-2">{pending ? "Enviando…" : "Enviar mensaje"}</button></div>
    </form>);
}
