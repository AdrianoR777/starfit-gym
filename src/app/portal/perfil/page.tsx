import { requireUser, NotConfigured } from "@/lib/guard";
import ProfileForm from "@/components/ProfileForm";
export default async function Page({ searchParams }: { searchParams: Promise<{ mfa?: string }> }) {
  const { sb, user } = await requireUser();
  if (!sb) return <NotConfigured />;
  const { mfa } = await searchParams;
  const { data: p } = await sb.from("profiles").select("full_name,phone,stats_hidden,notify_email,notify_whatsapp").eq("id", user.id).single();
  return (<div className="space-y-6"><h1 className="display text-5xl">Perfil</h1>
    {mfa && <p role="alert" className="card border-amber-500/50 p-4 text-amber-200">El personal debe activar la verificación en dos pasos (TOTP) para acceder a paneles internos.</p>}
    <p className="text-mute">{user.email}</p>{p && <ProfileForm p={p} />}
    <section className="card p-6"><h2 className="font-semibold">Wearables</h2><p className="mt-2 text-sm text-mute">Apple Health, Health Connect y Garmin requieren apps nativas o programas de desarrollador aprobados. Integración no disponible aún; nunca se conectará sin tu consentimiento explícito.</p></section>
  </div>);
}
