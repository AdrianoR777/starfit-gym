import Link from "next/link";
export const dynamic = "force-dynamic";
const nav = [["/admin", "Resumen"], ["/admin/socios", "Socios"], ["/admin/equipos", "Equipos"], ["/admin/contenido", "Contenido web"], ["/recepcion", "Recepción"]];
export default function L({ children }: { children: React.ReactNode }) {
  return (<><nav aria-label="Administración" className="sticky top-0 z-30 border-b border-line bg-ink/90 backdrop-blur"><div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 py-3 md:px-8">
    {nav.map(([h, l]) => <Link key={h} href={h} className="whitespace-nowrap rounded-full px-4 py-2 text-sm text-mute hover:bg-graphite hover:text-bone">{l}</Link>)}</div></nav>{children}</>);
}
