"use client";
import { useActionState } from "react";
import { logWorkout } from "@/lib/actions";
import { Msg } from "./AuthForms";
type Item = { name: string; sets?: number; reps?: string; rest_s?: number; notes?: string };
export default function WorkoutLog({ planId, items }: { planId: string; items: Item[] }) {
  const [s, act, pending] = useActionState(logWorkout, undefined);
  return (
    <form action={act} className="space-y-3">
      <input type="hidden" name="plan" value={planId} />
      {items.map((it, i) => (
        <label key={i} className="card flex items-start gap-4 p-4">
          <input type="checkbox" name="done" value={it.name} className="mt-1 size-5 accent-[#C9FF43]" />
          <span className="flex-1"><span className="font-semibold">{it.name}</span><span className="block text-sm text-mute">{it.sets ?? "–"} × {it.reps ?? "–"} · descanso {it.rest_s ?? "–"}s</span>{it.notes && <span className="block text-xs text-mute">{it.notes}</span>}</span>
        </label>))}
      <label className="block"><span className="text-sm text-mute">Esfuerzo percibido (1–10)</span><input className="field mt-1" type="number" name="effort" min={1} max={10} defaultValue={6} /></label>
      <label className="block"><span className="text-sm text-mute">Notas (opcional)</span><textarea className="field mt-1" name="notes" rows={2} maxLength={1000} /></label>
      <Msg s={s} /><button disabled={pending} className="btn btn-lime">Registrar sesión</button>
      <p className="text-xs text-mute">Si sientes dolor o malestar, detente y consulta a tu entrenador o a un profesional de salud.</p>
    </form>
  );
}
