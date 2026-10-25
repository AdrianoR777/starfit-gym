"use client";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
export default function QrCredential() {
  const [svg, setSvg] = useState<string>(); const [err, setErr] = useState<string>(); const [left, setLeft] = useState(0);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>; let tick: ReturnType<typeof setInterval>;
    const load = async () => {
      const r = await fetch("/api/access/token", { method: "POST", cache: "no-store" });
      const j = await r.json();
      if (!r.ok) { setErr({ qr_not_configured: "Acceso QR pendiente de configurar.", no_credential: "Tu credencial se genera al activar tu membresía." }[j.error as string] ?? "No disponible"); return; }
      setErr(undefined); setSvg(await QRCode.toString(j.token, { type: "svg", margin: 1, color: { dark: "#080A0A", light: "#F5F5F2" } }));
      setLeft(j.ttl); clearInterval(tick); tick = setInterval(() => setLeft((l) => Math.max(0, l - 1)), 1000);
      timer = setTimeout(load, (j.ttl - 3) * 1000);
    };
    load(); return () => { clearTimeout(timer); clearInterval(tick); };
  }, []);
  if (err) return <p className="card p-6 text-mute">{err}</p>;
  return (
    <div className="mx-auto max-w-xs text-center">
      <div className="rounded-3xl bg-bone p-5" aria-label="Código QR de acceso temporal" role="img" dangerouslySetInnerHTML={{ __html: svg ?? "" }} />
      <p className="mt-4 text-sm text-mute">Se renueva en {left}s · válido una sola vez</p>
    </div>
  );
}
