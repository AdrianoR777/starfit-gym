import type { Forecast } from "@/lib/forecast";
import { OPEN_HOURS } from "@/lib/forecast";

const days = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

// Mapa de calor de afluencia estimada (predicción, no ocupación observada)
export function Heatmap({ forecast }: { forecast: Forecast }) {
  if (!forecast.ok) return null;
  const hours = Array.from({ length: OPEN_HOURS.to - OPEN_HOURS.from + 1 }, (_, i) => OPEN_HOURS.from + i);
  const max = Math.max(1, ...forecast.slots.map((s) => s.estimate));
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-separate border-spacing-1 text-xs" aria-label="Afluencia estimada por día y hora">
        <thead><tr><th className="w-10" />{hours.map((h) => <th key={h} scope="col" className="font-normal text-mute">{h}</th>)}</tr></thead>
        <tbody>{days.map((d, i) => (
          <tr key={d}><th scope="row" className="pr-2 text-left font-normal text-mute">{d}</th>
            {hours.map((h) => {
              const s = forecast.slots.find((x) => x.dow === i + 1 && x.hour === h)!;
              const a = s.estimate / max;
              return <td key={h} title={`${d} ${h}:00 · ~${s.estimate} personas · confianza ${s.confidence}`}
                className={`h-8 rounded-md ${s.confidence === "baja" ? "border border-dashed border-line" : ""}`}
                style={{ background: s.confidence === "baja" ? "transparent" : `rgba(201,255,67,${0.08 + a * 0.85})` }}><span className="sr-only">{s.estimate}</span></td>;
            })}</tr>))}</tbody>
      </table>
      <p className="mt-3 text-xs text-mute">Estimación basada en {forecast.totalVisits} entradas de las últimas {forecast.weeks} semanas. Casillas punteadas: datos insuficientes. Es una predicción, no la ocupación actual.</p>
    </div>
  );
}
