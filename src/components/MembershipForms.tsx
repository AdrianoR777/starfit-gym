"use client";
import { useActionState, useState } from "react";
import Script from "next/script";
import { chooseMembership } from "@/lib/actions";
import { Msg } from "./AuthForms";

export function ChoosePlan({ planId, total }: { planId: string; total: string }) {
  const [s, act, pending] = useActionState(chooseMembership, undefined);
  return (
    <form action={act} className="space-y-4">
      <input type="hidden" name="plan" value={planId} />
      <p className="text-lg">Total a pagar: <strong>{total}</strong></p>
      <label className="flex gap-3 text-sm text-mute"><input type="checkbox" name="accept" required className="mt-1 accent-[#C9FF43]" />Leí y acepto los términos, la duración y el precio total del plan.</label>
      <label className="flex gap-3 text-sm text-mute"><input type="checkbox" name="renew" className="mt-1 accent-[#C9FF43]" />(Opcional) Autorizo que me recuerden y propongan la renovación. Nunca se cobra sin mi confirmación.</label>
      <Msg s={s} /><button disabled={pending} className="btn btn-lime">Continuar al pago</button>
    </form>
  );
}

declare global { interface Window { CulqiCheckout?: new (key: string, cfg: object) => { open(): void; culqi?: () => void; token?: { id: string; email: string }; close(): void } } }

export function PayButton({ membershipId, amountCents, publicKey }: { membershipId: string; amountCents: number; publicKey: string }) {
  const [state, setState] = useState<string>();
  const open = () => {
    if (!window.CulqiCheckout) return setState("No se pudo cargar Culqi.");
    const c = new window.CulqiCheckout(publicKey, { settings: { title: "STARFIT GYM", currency: "PEN", amount: amountCents }, client: {}, options: { lang: "es", paymentMethods: { tarjeta: true, yape: true } } });
    c.culqi = async () => {
      if (!c.token) return; c.close(); setState("Verificando pago…");
      const r = await fetch("/api/payments/charge", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ membershipId, culqiToken: c.token.id, email: c.token.email }) });
      const j = await r.json(); setState(j.message ?? j.error); if (r.ok) location.reload();
    };
    c.open();
  };
  return (<><Script src="https://js.culqi.com/checkout-js" strategy="lazyOnload" /><button onClick={open} className="btn btn-lime">Pagar ahora</button>{state && <p role="status" className="mt-3 text-sm">{state}</p>}</>);
}
