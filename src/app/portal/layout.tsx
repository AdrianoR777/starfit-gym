export const dynamic = "force-dynamic";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { logoSrc } from "@/lib/brand";
import { Home, CalendarDays, QrCode, Dumbbell, User, Cog, Bell } from "lucide-react";
const nav = [["/portal", "Inicio", Home], ["/portal/reservas", "Clases", CalendarDays], ["/portal/credencial", "Acceso", QrCode], ["/portal/entrenamientos", "Rutina", Dumbbell], ["/portal/maquinas", "Máquinas", Cog], ["/portal/notificaciones", "Avisos", Bell], ["/portal/perfil", "Perfil", User]] as const;
export default async function L({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-svh pb-24 md:pb-0 md:pl-60">
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-line p-6 md:flex">
        <Link href="/" aria-label="Inicio"><Logo src={await logoSrc()} /></Link>
        <nav className="mt-10 space-y-1" aria-label="Portal">{nav.map(([h, l, I]) => <Link key={h} href={h} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-mute hover:bg-graphite hover:text-bone"><I size={18} />{l}</Link>)}</nav>
        <form action="/auth/signout" method="post" className="mt-auto"><button className="text-sm text-mute hover:text-bone">Cerrar sesión</button></form>
      </aside>
      <main id="main" className="mx-auto max-w-5xl px-4 py-8 md:px-10 md:py-12">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-7 border-t border-line bg-ink/95 backdrop-blur md:hidden" aria-label="Portal móvil">
        {nav.map(([h, l, I]) => <Link key={h} href={h} className="flex flex-col items-center gap-1 py-3 text-[11px] text-mute"><I size={20} />{l}</Link>)}
      </nav>
    </div>
  );
}
