import Link from "next/link";
import { Logo } from "@/components/Logo";
import { logoSrc } from "@/lib/brand";
export default async function L({ children }: { children: React.ReactNode }) {
  return (
    <main id="main" className="grid min-h-svh lg:grid-cols-2">
      <div className="grain relative hidden overflow-hidden bg-graphite lg:block"><video className="absolute inset-0 h-full w-full object-cover opacity-60" autoPlay muted loop playsInline poster="/media/video/strength.webp"><source src="/media/video/strength.mp4" type="video/mp4" /></video><div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/20 to-transparent" /><p className="display absolute bottom-12 left-12 z-10 text-8xl">Beyond<br /><span className="text-lime">your limits</span></p></div>
      <div className="flex items-center justify-center px-4 py-16"><div className="w-full max-w-sm"><Link href="/" aria-label="Inicio"><Logo src={await logoSrc()} /></Link>{children}</div></div>
    </main>
  );
}
