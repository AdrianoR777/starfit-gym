"use client";
import { useActionState, useState } from "react";
import { savePlan } from "@/lib/trainer-actions";
import { Msg } from "./AuthForms";

type Item = { name: string; sets: number; reps: string; rest_s: number; notes?: string };
const blank: Item = { name: "", sets: 3, reps: "10", rest_s: 60 };

export default function PlanEditor({ member, plan }: { member: string; plan?: { id: string; name: string; items: Item[] } }) {
  const [rows, setRows] = useState<Item[]>(plan?.items.length ? plan.items : [blank]);
  const [s, act, pending] = useActionState(savePlan, undefined);
  return (
    <form action={act} className="card space-y-4 p-6">
      <input type="hidden" name="member" value={member} /><input type="hidden" name="plan" value={plan?.id ?? ""} />
      <label className="block"><span className="text-sm text-mute">Nombre del plan</span><input id="p-name" name="plan_name" defaultValue={plan?.name ?? "Plan semanal"} maxLength={80} className="field mt-1" /></label>
      <div className="space-y-2">{rows.map((r, i) => (
        <div key={i} className="grid gap-2 rounded-xl border border-line p-3 sm:grid-cols-[2fr_repeat(3,minmax(0,1fr))_auto]">
          <input name="name" defaultValue={r.name} placeholder="Ejercicio" aria-label="Ejercicio" className="field" />
          <input name="sets" type="number" min={1} max={10} defaultValue={r.sets} aria-label="Series" className="field" />
          <input name="reps" defaultValue={r.reps} aria-label="Repeticiones" placeholder="10" className="field" />
          <input name="rest_s" type="number" min={0} max={600} defaultValue={r.rest_s} aria-label="Descanso (s)" className="field" />
          <button type="button" onClick={() => setRows(rows.filter((_, j) => j !== i))} className="btn btn-ghost !py-2 text-sm" aria-label="Quitar ejercicio">Quitar</button>
          <input name="notes" defaultValue={r.notes} placeholder="Nota técnica o alternativa (opcional)" aria-label="Notas" className="field sm:col-span-5" />
        </div>))}</div>
      <button type="button" onClick={() => setRows([...rows, blank])} className="btn btn-ghost text-sm">+ Agregar ejercicio</button>
      <label className="flex items-center gap-3 text-sm"><input type="checkbox" name="approve" defaultChecked className="size-5 accent-[#C9FF43]" />Aprobar y publicar al socio</label>
      <div className="flex items-center gap-4"><button disabled={pending} className="btn btn-lime">{pending ? "Guardando…" : "Guardar plan"}</button><Msg s={s} /></div>
    </form>);
}
