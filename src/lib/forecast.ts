// Predicción de afluencia a partir de registros históricos agregados (sin datos personales).
// Modelo deliberadamente simple y explicable: promedio de entradas por franja (día/hora) × permanencia media.

export type HistoryRow = { dow: number; hour: number; visits: number; days: number };
export type Confidence = "alta" | "media" | "baja";
export type Slot = { dow: number; hour: number; arrivals: number; estimate: number; confidence: Confidence };
export type Forecast = { ok: true; slots: Slot[]; weeks: number; totalVisits: number } | { ok: false; reason: "insufficient_data"; totalVisits: number };

export const MIN_VISITS = 50; // por debajo no se pronostica
export const OPEN_HOURS = { from: 6, to: 22 }; // 6:00 – 22:30

export function buildForecast(rows: HistoryRow[], periodDays: number, avgStayHours = 1.25): Forecast {
  const totalVisits = rows.reduce((a, r) => a + r.visits, 0);
  if (totalVisits < MIN_VISITS) return { ok: false, reason: "insufficient_data", totalVisits };
  const weeks = Math.max(1, periodDays / 7);
  const byKey = new Map(rows.map((r) => [`${r.dow}-${r.hour}`, r]));
  const slots: Slot[] = [];
  for (let dow = 1; dow <= 7; dow++) {
    for (let hour = 0; hour < 24; hour++) {
      const r = byKey.get(`${dow}-${hour}`);
      const arrivals = r ? r.visits / weeks : 0;
      // personas simultáneas ≈ llegadas en esta hora y en las anteriores que siguen dentro
      const prev = byKey.get(`${dow}-${hour - 1}`);
      const carry = prev ? (prev.visits / weeks) * Math.max(0, avgStayHours - 1) : 0;
      const seenWeeks = r?.days ?? 0;
      const confidence: Confidence = seenWeeks >= Math.min(6, weeks * 0.75) ? "alta" : seenWeeks >= 3 ? "media" : "baja";
      slots.push({ dow, hour, arrivals, estimate: Math.round((arrivals * Math.min(avgStayHours, 1) + carry) * 10) / 10, confidence });
    }
  }
  return { ok: true, slots, weeks: Math.round(weeks), totalVisits };
}

// Horas menos concurridas de un día dentro del horario de atención
export function quietestHours(f: Forecast, dow: number, n = 3) {
  if (!f.ok) return [];
  return f.slots
    .filter((s) => s.dow === dow && s.hour >= OPEN_HOURS.from && s.hour <= OPEN_HOURS.to && s.confidence !== "baja")
    .sort((a, b) => a.estimate - b.estimate || a.hour - b.hour)
    .slice(0, n);
}

export function occupancyLevel(inside: number, capacity: number | null) {
  if (!capacity) return { pct: null, label: "Aforo no configurado" } as const;
  const pct = Math.min(100, Math.round((inside / capacity) * 100));
  return { pct, label: pct < 40 ? "Tranquilo" : pct < 75 ? "Moderado" : "Concurrido" } as const;
}
