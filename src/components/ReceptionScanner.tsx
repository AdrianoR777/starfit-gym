"use client";
import { useEffect, useRef, useState } from "react";
type R = { granted: boolean; reason?: string; name?: string; endsOn?: string };
const reasons: Record<string, string> = { expired: "QR vencido", bad_signature: "QR inválido", malformed: "QR inválido", revoked: "Credencial revocada", no_active_membership: "Sin membresía activa", replayed: "QR ya utilizado", forbidden: "Sin permiso en esta sede" };
export default function ReceptionScanner({ locations }: { locations: { id: string; name: string }[] }) {
  const [loc, setLoc] = useState(locations[0]?.id ?? ""); const [res, setRes] = useState<R>(); const [cam, setCam] = useState(false);
  const video = useRef<HTMLVideoElement>(null); const input = useRef<HTMLInputElement>(null);
  const validate = async (token: string) => {
    const r = await fetch("/api/access/validate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, locationId: loc }) });
    setRes(await r.json());
  };
  useEffect(() => {
    if (!cam || !("BarcodeDetector" in window)) return;
    let stop = false; let stream: MediaStream;
    // @ts-expect-error API experimental del navegador
    const det = new window.BarcodeDetector({ formats: ["qr_code"] });
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } }).then(async (s) => {
      stream = s; video.current!.srcObject = s; await video.current!.play();
      while (!stop) { const codes = await det.detect(video.current!); if (codes[0]) { await validate(codes[0].rawValue); await new Promise((r) => setTimeout(r, 2500)); } await new Promise((r) => setTimeout(r, 300)); }
    });
    return () => { stop = true; stream?.getTracks().forEach((t) => t.stop()); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cam, loc]);
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="card space-y-4 p-6">
        <label className="block"><span className="text-sm text-mute">Sede</span><select className="field mt-1" value={loc} onChange={(e) => setLoc(e.target.value)}>{locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</select></label>
        <form onSubmit={(e) => { e.preventDefault(); validate(input.current!.value); input.current!.value = ""; }}>
          <label className="block"><span className="text-sm text-mute">Lector USB / pegar código</span><input ref={input} className="field mt-1" autoFocus autoComplete="off" /></label>
        </form>
        <button onClick={() => setCam(!cam)} className="btn btn-ghost w-full justify-center text-lg">{cam ? "Detener cámara" : "Escanear con cámara"}</button>
        <video ref={video} className={cam ? "w-full rounded-xl" : "hidden"} muted playsInline />
      </div>
      <div aria-live="assertive" className={`card flex min-h-64 flex-col items-center justify-center p-8 text-center ${res ? (res.granted ? "!bg-lime text-ink" : "!bg-red-500/20") : ""}`}>
        {res ? (res.granted ? <><p className="display text-6xl">Acceso OK</p><p className="mt-3 text-xl">{res.name}</p><p className="text-sm">Vigente hasta {res.endsOn ?? "—"}</p></> : <><p className="display text-5xl">Denegado</p><p className="mt-3">{reasons[res.reason ?? ""] ?? res.reason}</p></>) : <p className="text-mute">Esperando QR…</p>}
      </div>
    </div>
  );
}
