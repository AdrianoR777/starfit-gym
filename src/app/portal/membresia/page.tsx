import { requireUser, NotConfigured } from "@/lib/guard";
import { ChoosePlan, PayButton } from "@/components/MembershipForms";
import { MembershipControls } from "@/components/SelfService";
import { Pending } from "@/components/ui";
import { formatPEN, integrations } from "@/lib/config";

export default async function Page({ searchParams }: { searchParams: Promise<{ plan?: string }> }) {
  const { sb, user } = await requireUser();
  if (!sb) return <NotConfigured />;
  const { plan } = await searchParams;
  const [{ data: list }, { data: chosen }, { data: pays }] = await Promise.all([
    sb.from("memberships").select("id,status,starts_on,ends_on,created_at,cancelled_at,paused_until,pause_days_used,membership_plans(name,price_cents,enrollment_fee_cents,max_pause_days,cancel_policy)").eq("user_id", user.id).order("created_at", { ascending: false }),
    plan ? sb.from("membership_plans").select("*").eq("id", plan).maybeSingle() : Promise.resolve({ data: null }),
    sb.from("payments").select("id,amount_cents,status,provider,created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
  ]);
  const pending = list?.find((m) => m.status === "pending_payment");
  const current = list?.find((m) => m.status === "active" || m.status === "suspended");
  const cp = current?.membership_plans as unknown as { name: string; max_pause_days: number; cancel_policy: string } | undefined;
  const pp = pending?.membership_plans as unknown as { price_cents: number; enrollment_fee_cents: number } | undefined;
  return (
    <div className="space-y-8">
      <h1 className="display text-5xl">Membresía</h1>
      {current && cp && (
        <section className="card p-6"><p className="eyebrow">Membresía actual</p><h2 className="display mt-2 text-3xl">{cp.name}</h2>
          <p className="mt-1 text-sm text-mute">{current.status === "active" ? "Activa" : "Pausada"} · vence {current.ends_on ?? "—"}{current.cancelled_at && " · cancelada (no se renovará)"}</p>
          {!current.cancelled_at && <div className="mt-5"><MembershipControls id={current.id} status={current.status} maxPause={cp.max_pause_days} used={current.pause_days_used} policy={cp.cancel_policy} pausedUntil={current.paused_until} /></div>}
        </section>)}
      {chosen && !pending && (
        <section className="card p-6"><p className="eyebrow">Plan seleccionado</p><h2 className="display mt-2 text-3xl">{chosen.name}</h2>
          <p className="mt-2 whitespace-pre-line text-sm text-mute">{chosen.terms}</p>
          {chosen.price_cents > 0 ? <div className="mt-6"><ChoosePlan planId={chosen.id} total={formatPEN(chosen.price_cents + chosen.enrollment_fee_cents)} /></div> : <p className="mt-4 text-amber-300">Precio por confirmar: consulta en recepción.</p>}
        </section>)}
      {pending && pp && (
        <section className="card p-6"><p className="eyebrow">Pago pendiente</p><p className="mt-2 text-2xl">{formatPEN(pp.price_cents + pp.enrollment_fee_cents)}</p>
          <div className="mt-4">{integrations.culqi ? <PayButton membershipId={pending.id} amountCents={pp.price_cents + pp.enrollment_fee_cents} publicKey={process.env.NEXT_PUBLIC_CULQI_PUBLIC_KEY!} /> : <Pending what="El pago en línea estará disponible pronto. Por ahora puedes pagar en recepción o coordinar por WhatsApp." />}</div>
        </section>)}
      <section><h2 className="mb-3 font-semibold">Historial</h2>
        <ul className="space-y-2">{list?.map((m) => <li key={m.id} className="card flex justify-between p-4 text-sm"><span>{(m.membership_plans as unknown as { name: string }).name}</span><span className="text-mute">{m.status} {m.starts_on && `· ${m.starts_on} → ${m.ends_on ?? "—"}`}</span></li>)}</ul>
      </section>
      <section><h2 className="mb-3 font-semibold">Pagos</h2>
        {pays?.length ? <ul className="space-y-2">{pays.map((p) => <li key={p.id} className="card flex justify-between p-4 text-sm"><span>{formatPEN(p.amount_cents)} · {p.provider}</span><span className="text-mute">{p.status}</span></li>)}</ul> : <p className="text-mute">Sin pagos.</p>}
        <p className="mt-3 text-xs text-mute">Comprobantes electrónicos SUNAT: integración con OSE/PSE pendiente.</p>
      </section>
    </div>
  );
}
