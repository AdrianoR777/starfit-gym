// Prueba de humo contra la web publicada: BASE_URL=https://tu-dominio npx playwright test tests/e2e
import { test, expect } from "@playwright/test";
const base = process.env.BASE_URL ?? "http://localhost:3000";
const pages = ["/", "/sedes", "/membresias", "/clases", "/horarios", "/ocupacion", "/tecnologia", "/contacto", "/faq", "/login", "/registro", "/recuperar"];
for (const p of pages) test(`carga ${p}`, async ({ page }) => {
  const errors: string[] = []; page.on("pageerror", (e) => errors.push(e.message));
  const res = await page.goto(base + p); expect(res?.status()).toBeLessThan(400); expect(errors).toEqual([]);
});
test("rutas privadas piden login", async ({ page }) => {
  await page.goto(base + "/portal");
  test.skip(await page.getByText("Esta sección no está disponible en este momento").isVisible(), "Supabase aún no configurado en este entorno");
  for (const p of ["/portal", "/admin", "/entrenador", "/recepcion"]) { await page.goto(base + p); await expect(page).toHaveURL(/\/login/); }
});
test("API protegidas rechazan sin sesión", async ({ request }) => {
  expect((await request.get(base + "/api/cron/daily")).status()).toBe(401);
  expect((await request.get(base + "/admin/export?tipo=pagos")).status()).toBeGreaterThanOrEqual(300);
});
test("móvil sin desbordes horizontales", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await page.goto(base + "/");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
});
