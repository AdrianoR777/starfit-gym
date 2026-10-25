import QrCredential from "@/components/QrCredential";
export default function Page() {
  return (<div className="space-y-6"><h1 className="display text-5xl">Credencial</h1><QrCredential />
    <p className="text-center text-xs text-mute">Muéstralo en recepción. La apertura automática de torniquetes está deshabilitada hasta integrar y probar el hardware.</p></div>);
}
