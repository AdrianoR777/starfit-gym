# Publicar STARFIT GYM (paso a paso, ~45 min)

Todo el código está listo. Solo faltan las cuentas, que debe crear el dueño del gimnasio.

## 1 · GitHub (guardar el código)
1. Crea una cuenta en https://github.com y un repositorio **privado** llamado `starfit-gym`.
2. Sube el código: descomprime `starfit-gym.zip` y en esa carpeta ejecuta
   ```bash
   git init && git add . && git commit -m "STARFIT GYM"
   git remote add origin https://github.com/TU_USUARIO/starfit-gym.git
   git push -u origin HEAD:main
   ```
   (o conecta GitHub en claude.ai → Configuración → Conectores y pídele a Claude que lo suba).

## 2 · Supabase (base de datos y cuentas de socios)
1. https://supabase.com → **New project** → región **South America (São Paulo)**. Guarda la contraseña de la base de datos.
2. **Authentication → URL Configuration**
   - Site URL: `https://TU-DOMINIO` (o `https://starfit-gym.vercel.app` al inicio)
   - Redirect URLs: `https://TU-DOMINIO/auth/callback`
3. **Authentication → Providers → Email**: activo, con confirmación de correo. **Authentication → MFA**: activa TOTP (obligatorio para el personal).
4. **Storage**: el bucket `branding` se crea solo con la migración 0004.
5. Crea las tablas y los datos de STARFIT (antes completa los `TODO` de `supabase/datos-starfit.sql`: capacidad, planes, horarios):
   ```bash
   DATABASE_URL="postgresql://postgres:CLAVE@db.REF.supabase.co:5432/postgres" scripts/setup-db.sh
   ```
   La URI está en Project Settings → Database → Connection string. El script se puede ejecutar varias veces.

## 3 · Vercel (dirección pública)
1. https://vercel.com → entra con GitHub → **Add New Project** → elige `starfit-gym`.
2. En **Environment Variables** agrega (Supabase → Project Settings → API):

| Variable | Valor |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://TU-DOMINIO` |
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key (**secreta**) |
| `QR_SIGNING_SECRET` | resultado de `openssl rand -base64 48` |
| `CRON_SECRET` | resultado de `openssl rand -hex 32` |
| `REQUIRE_STAFF_MFA` | `true` |

3. **Deploy**. Las tareas diarias (`vercel.json`) quedan programadas a las 00:10 hora de Lima.
4. Dominio propio (opcional): Vercel → Settings → Domains.

## 4 · Primer administrador
1. Regístrate en `https://TU-DOMINIO/registro` y confirma el correo.
2. Activa la verificación en dos pasos en tu perfil (pendiente: pantalla de enrolamiento; mientras tanto usa `REQUIRE_STAFF_MFA=false` solo los primeros minutos).
3. Ejecuta: `DATABASE_URL=... scripts/hacer-admin.sh tu@correo.com owner`
4. Repite con recepción (`reception`) y entrenadores (`trainer`).
5. Entra a `/admin/contenido` para revisar logo, textos y colores.

## 5 · Comprobar que todo funciona
```bash
BASE_URL=https://TU-DOMINIO npm run e2e
```
Luego, a mano: registrarse, reservar una clase, ver la credencial QR, escanearla en `/recepcion`, ver el aforo en `/ocupacion`.

## 6 · Pagos en línea (cuando haya RUC)
Cuenta de empresa en https://culqi.com → llaves de **integración** (`pk_test`, `sk_test`) en Vercel como `NEXT_PUBLIC_CULQI_PUBLIC_KEY` y `CULQI_SECRET_KEY`, más `CULQI_WEBHOOK_SECRET`. Webhook en Culqi: `https://TU-DOMINIO/api/payments/webhook?k=CULQI_WEBHOOK_SECRET`. Sin estas llaves la web muestra "pago en recepción".

## Costos de partida
GitHub, Supabase (plan Free) y Vercel (Hobby) son gratuitos para empezar. Para uso comercial se recomienda Vercel Pro (US$ 20/mes) y Supabase Pro (US$ 25/mes) por respaldos diarios.
