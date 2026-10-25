import { describe, expect, it } from "vitest";
import { buildForecast, quietestHours, occupancyLevel, MIN_VISITS } from "./forecast";

describe("predicción de afluencia", () => {
  it("no pronostica sin datos suficientes", () => {
    const f = buildForecast([{ dow: 1, hour: 7, visits: MIN_VISITS - 1, days: 8 }], 56);
    expect(f.ok).toBe(false);
  });
  it("promedia por semana y marca confianza", () => {
    const f = buildForecast([{ dow: 1, hour: 7, visits: 80, days: 8 }, { dow: 1, hour: 19, visits: 160, days: 2 }], 56);
    if (!f.ok) throw new Error();
    const at7 = f.slots.find((s) => s.dow === 1 && s.hour === 7)!;
    const at19 = f.slots.find((s) => s.dow === 1 && s.hour === 19)!;
    expect(at7.arrivals).toBe(10);
    expect(at7.confidence).toBe("alta");
    expect(at19.confidence).toBe("baja");
  });
  it("recomienda horas tranquilas solo dentro del horario y con confianza suficiente", () => {
    const rows = [6, 10, 18].map((hour, i) => ({ dow: 2, hour, visits: [40, 8, 120][i], days: 8 }));
    const f = buildForecast(rows, 56);
    const q = quietestHours(f, 2, 3);
    expect(q.every((s) => s.hour >= 6 && s.hour <= 22)).toBe(true);
    expect(q[0].hour).not.toBe(18);
  });
  it("calcula nivel de ocupación", () => {
    expect(occupancyLevel(20, 80)).toEqual({ pct: 25, label: "Tranquilo" });
    expect(occupancyLevel(5, null).pct).toBeNull();
  });
});
