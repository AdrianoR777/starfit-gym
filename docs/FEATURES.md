# Registro de funciones — GYM EXPERIENCE 2026 (STARFIT)

Estado verificado al 25-oct-2026. "Probado" = cubierto por pruebas automáticas o verificación manual en navegador.
Categorías: **A** software propio · **B** proveedor externo · **C** hardware.

| # | Función | Cat. | Estado | Evidencia / pendiente |
|---|---|---|---|---|
| — | Web pública cinematográfica (16 páginas, GSAP, Lenis, transiciones) | A | ✅ Hecho | Build + capturas desktop/móvil |
| — | Auth, roles, MFA staff, RLS multi-organización | A | ✅ Código | RLS probada en `tests/db` |
| — | CMS de marca: nombre, logo, colores, portada, video, horario, redes (`/admin/contenido`) | A | ✅ Código | Socio no puede editar (RLS) — probado; subida a Storage requiere bucket `branding` (migración 0004) |
| — | Gestión de socios con búsqueda, filtro y paginación (`/admin/socios`) | A | ✅ Código | Según RLS de owner/admin/recepción |
| — | Panel del entrenador (`/entrenador`): socios asignados, editor de planes, aprobar/rechazar, historial | A | ✅ Código | Solo ve socios asignados; socio solo ve planes aprobados; historial automático — probado |
| 01 | Ocupación en vivo por sede (`/ocupacion`) | A | ✅ Hecho | `live_occupancy` (solo totales, anónimo no ve registros) — probado |
| 01 | Corrección de registros sin salida | A | ✅ Hecho | `close_stale_checkins` + botón en Recepción — probado |
| 02 | Predicción de afluencia + mapa de calor + confianza | A | ✅ Hecho | `lib/forecast.ts` (no pronostica con < 50 entradas) — 4 tests |
| 03 | Tour 3D / 360° | C* | ⏳ Pendiente | Requiere modelos GLB o fotos 360° reales de las sedes |
| 04 | Estado de máquinas con origen y antigüedad | A | ✅ Hecho | `set_equipment_status` solo staff, auditado — probado |
| 05 | Turnos virtuales por máquina | A | ✅ Hecho | join/advance/confirm/leave, 1 turno por socio, expiración — probado |
| 06 | Máquinas conectadas (EGYM u otros) | C | ⏳ Pendiente | Columna `status_source` lista para adaptador por proveedor |
| 07 | Entrenador IA | B | ⏳ Pendiente | Requiere proveedor IA + flujo de aprobación del entrenador |
| 08 | Asistente de movimiento por cámara | B | ⏳ Pendiente | `user_consents.camera_motion` preparado |
| 09 | Planificador adaptativo | A | 🟡 Parcial | Rutinas + registro; falta sustitución automática por máquina no disponible |
| 10 | Wearables | B | ⏳ Pendiente | `wearable_connections` + consentimiento |
| 11 | Clases virtuales | B | ⏳ Pendiente | Requiere contenido propio/licenciado y hosting de video |
| 12 | Reservas con lista de espera y anti-sobreventa | A | ✅ Hecho | Prueba de concurrencia: 3 sesiones, 1 cupo → 1/1/2 |
| 13 | Marketplace de entrenadores | A+B | ⏳ Pendiente | Perfiles existen; faltan tarifas y pago |
| 14 | Credencial digital QR firmada, un solo uso | A | ✅ Hecho | 4 tests + nonce único en BD |
| 15 | Autoservicio de membresía | A+B | 🟡 Parcial | Alta, pausa con límite del plan, reanudar, cancelación simple sin perder periodo pagado — probado. Pendiente: cambio de plan; pago requiere Culqi |
| 16 | Casilleros | C | ⏳ Pendiente | — |
| 17 | Plano interactivo 2D | A | ✅ Hecho | `/instalaciones` (requiere zonas cargadas) |
| 18 | Guía AR | C | ⏳ Pendiente | — |
| 19 | Sensores ambientales | C | ⏳ Pendiente | No se muestran mediciones sin sensor |
| 20 | Mantenimiento: tickets de socios, gestión staff | A | ✅ Hecho | Socio no puede fijar costo/asignar (RLS) — probado |
| 21 | Gamificación | A | ⏳ Pendiente | Tablas `rewards`/`achievements` |
| 22 | Concierge IA | B | ⏳ Pendiente | — |
| 23 | Notificaciones | A+B | 🟡 Parcial | Centro en la web + preferencias por categoría/canal/máximo diario + permiso push del navegador. Envío por email/WhatsApp/push pendiente |
| 24 | Feedback / contacto | A | ✅ Hecho | Formulario → `support_requests`, honeypot, 3/h por IP |
| 25 | BI + exportación CSV | A | ✅ Hecho | KPIs reales + `/admin/export` (owner/admin) |
| — | Pagos Culqi + webhook idempotente | B | 🟡 Código | Sin probar en sandbox (faltan llaves) |

## Cómo probar la base de datos localmente
```bash
PGURL='postgres://postgres@/postgres?host=/tmp&port=5499' tests/db/run.sh        # 33 pruebas
PGURL='postgres://postgres@/postgres?host=/tmp&port=5499' tests/db/concurrency.sh  # concurrencia
npm test                                                                          # unitarias
```

## Tareas programadas recomendadas (Supabase cron)
- `select close_stale_checkins();` diario 03:00 America/Lima.
- `select membership_daily_maintenance();` diario 00:10 America/Lima (reactiva pausas, expira vencidas, aviso 7 días antes).
- `select queue_advance(id) from equipment where queue_enabled;` cada minuto.
