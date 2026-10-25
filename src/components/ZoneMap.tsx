"use client";
import { useState } from "react";
type Zone = { id: string; name: string; kind: string; description: string | null; rules: string | null; capacity: number | null; map_shape: { x: number; y: number; w: number; h: number } | null };
export default function ZoneMap({ zones }: { zones: Zone[] }) {
  const [sel, setSel] = useState<Zone | null>(zones[0] ?? null);
  const mapped = zones.filter((z) => z.map_shape);
  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <svg viewBox="0 0 100 60" className="card w-full" role="group" aria-label="Plano del gimnasio">
        {mapped.map((z) => { const s = z.map_shape!; const on = sel?.id === z.id; return (
          <g key={z.id} tabIndex={0} role="button" aria-pressed={on} aria-label={z.name} onClick={() => setSel(z)} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setSel(z)} className="cursor-pointer focus:outline-none">
            <rect x={s.x} y={s.y} width={s.w} height={s.h} rx="1.5" fill={on ? "#C9FF43" : "#171B1D"} stroke={on ? "#C9FF43" : "#3a4144"} strokeWidth=".3" className="transition-colors" />
            <text x={s.x + 2} y={s.y + 5} fontSize="2.6" fontWeight="700" fill={on ? "#080A0A" : "#F5F5F2"}>{z.name}</text>
          </g> ); })}
      </svg>
      <aside className="card p-6" aria-live="polite">
        {sel ? (<>
          <p className="eyebrow">{sel.kind}</p>
          <h2 className="display mt-2 text-4xl">{sel.name}</h2>
          <p className="mt-4 text-mute">{sel.description ?? "Descripción por publicar."}</p>
          {sel.rules && <><h3 className="mt-6 font-semibold">Normas</h3><p className="text-mute">{sel.rules}</p></>}
          <p className="mt-6 text-sm text-mute">Aforo configurado: {sel.capacity ?? "no definido"}</p>
          <p className="mt-1 text-sm text-mute">Disponibilidad en vivo: no conectada (requiere sensores o control de acceso).</p>
        </>) : <p className="text-mute">Selecciona una zona.</p>}
      </aside>
    </div>
  );
}
