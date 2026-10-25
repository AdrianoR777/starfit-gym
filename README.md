# Star Fit Gym — plataforma GYMNOVA

Plataforma web full stack para **Star Fit Gym** ([@sstarfitgym](https://www.instagram.com/sstarfitgym/)), reutilizable para otros gimnasios.
Español · PEN · America/Lima.

**Stack:** Next.js 15 (App Router) · React 19 · TypeScript · Tailwind 4 · GSAP (ScrollTrigger, SplitText) · Lenis · Supabase (Postgres, Auth, RLS) · Zod · Culqi · Vitest.

## Estado real (honesto)

| Módulo | Estado |
|---|---|
| Web pública cinematográfica (15 páginas, GSAP + Lenis, reduced-motion) | ✅ Hecho y verificado (build + capturas desktop/móvil) |
| Esquema Postgres multi-org/multisede (37 tablas) + RLS | ✅ Migración escrita · ⚠️ no ejecutada contra un Supabase real en esta sesión |
| Registro / login / middleware de rutas privadas | ✅ Código · requiere Supabase |
| Portal del miembro (dashboard, constancia, reservas, rutina, perfil, membresía) | ✅ Código · requiere Supabase |
| Reservas transaccionales (`book_class` con `FOR UPDATE`, lista de espera, sin duplicados) | ✅ En SQL |
| Pago Culqi (cargo desde servidor, monto calculado en servidor, webhook idempotente con re-verificación) | ✅ Código · ⚠️ sin probar en sandbox (faltan llaves) |
| QR temporal HMAC (30 s, nonce de un solo uso, validación en servidor) | ✅ Código + 4 tests unitarios |
| Recepción (escáner cámara/USB, búsqueda) y Admin (KPIs reales, filtros fecha/sede) | ✅ Código · MFA (aal2) exigido al staff |
| Fondos de video/foto en todas las páginas, transición de página (cortina), zoom/parallax/revelado por máscara, galerías | ✅ Medios de stock referenciales (ver `public/media/CREDITS.md`)
| Mapa 2D interactivo de zonas (accesible con teclado) | ✅ |
| Ocupación | Solo vista histórica `hourly_traffic`; nada "en vivo" sin sensores |
| Emails (Resend), WhatsApp, cron de recordatorios, SUNAT, wearables, IA, 3D, portal de entrenador, mensajería UI, mantenimiento UI | ⏳ Tablas creadas; interfaz/integración pendiente (Fase 3–4) |
| Playwright E2E | ⏳ Pendiente (requiere Supabase de pruebas) |

No hay entrenadores, testimonios, precios ni cifras inventados: lo que no está configurado se muestra como "por confirmar" / "sin datos". El `seed.sql` está marcado **[DEMO]**.

## Publicar
Sigue **[DEPLOY.md](DEPLOY.md)** (GitHub → Supabase → Vercel → primer administrador).

## Funciones
Ver **[docs/FEATURES.md](docs/FEATURES.md)** para el estado verificado de cada función (A/B/C) y cómo correr las pruebas de base de datos.

## Puesta en marcha

```bash
npm install --legacy-peer-deps
cp .env.example .env.local     # completar
npx supabase link --project-ref <ref>
npx supabase db push           # aplica supabase/migrations
psql "$DB_URL" -f supabase/seed.sql   # opcional, datos DEMO
npm run dev
npm test
```

### Crear el primer administrador
Tras registrarte, en el SQL editor de Supabase:
```sql
insert into staff_members(user_id, organization_id, role)
values ('<auth.users.id>', '00000000-0000-0000-0000-000000000001', 'owner');
```
Luego activa MFA TOTP en Supabase Auth (el panel de staff exige nivel `aal2`; enrolamiento UI pendiente).

### Culqi (sandbox)
1. Llaves de integración en panel Culqi → `.env.local`.
2. Webhook: `https://tudominio.pe/api/payments/webhook?k=<CULQI_WEBHOOK_SECRET>` (evento `charge.creation.succeeded`).
3. Tarjetas de prueba de la documentación de Culqi.

### Despliegue (Vercel)
Importar el repo, configurar las variables de `.env.example`, dominio y `NEXT_PUBLIC_SITE_URL`. Supabase: configurar Site URL y Redirect URLs de Auth.

### Contenido a cargar por el gimnasio
Logo, fotos/video reales (`public/media/hero.mp4` + `hero-poster.jpg` se detectan solos), dirección, horarios, planes y precios, zonas del plano (`training_zones.map_shape` sobre lienzo 100×60), perfiles de entrenadores.

## Seguridad
RLS en todas las tablas · funciones `SECURITY DEFINER` con `search_path` fijo · `activate_membership` solo vía service role · CSP/HSTS/nosniff · `no-store` en rutas privadas · Zod en todos los formularios · audit_logs en pagos.
**Legal:** la política de privacidad es un borrador (Ley 29733 / D.S. 016-2024-JUS); requiere revisión profesional y registro del banco de datos ante la ANPD.

## Estructura
```
supabase/migrations/0001_init.sql   esquema, funciones, RLS
src/app/(public)/                   web pública
src/app/(auth)/                     login, registro
src/app/portal/                     portal del miembro (nav inferior móvil)
src/app/recepcion, src/app/admin    paneles de staff
src/app/api/                        QR token/validación, pagos, webhook
src/lib/qr.ts                       firma/verificación de QR (+ tests)
```
