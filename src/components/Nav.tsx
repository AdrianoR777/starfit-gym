"use client";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { gym } from "@/lib/config";

export const links = [
  ["/nosotros", "Nosotros"], ["/instalaciones", "Instalaciones"], ["/entrenadores", "Entrenadores"], ["/membresias", "Membresías"],
  ["/clases", "Clases"], ["/horarios", "Horarios"], ["/ocupacion", "Ocupación"], ["/servicios", "Servicios"], ["/tecnologia", "Tecnología"], ["/experiencias", "Experiencias"],
  ["/sedes", "Sedes"], ["/faq", "FAQ"], ["/blog", "Blog"], ["/contacto", "Contacto"],
] as const;

export function Nav({ logo }: { logo?: string | null }) {
  const [open, setOpen] = useState(false);
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-line/60 bg-ink/70 backdrop-blur-xl">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 btn btn-lime">Saltar al contenido</a>
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8" aria-label="Principal">
        <Link href="/" aria-label="Inicio"><Logo src={logo} /></Link>
        <ul className="hidden gap-6 text-sm text-mute xl:flex">
          {links.slice(0, 7).map(([h, l]) => <li key={h}><Link className="hover:text-bone" href={h}>{l}</Link></li>)}
        </ul>
        <div className="flex items-center gap-2">
          <Link href="/login" className="hidden text-sm text-mute hover:text-bone sm:block px-3">Ingresar</Link>
          <Link href="/membresias" className="btn btn-lime !py-2 text-sm">Únete</Link>
          <button className="p-2 xl:hidden" aria-expanded={open} aria-label="Menú" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
        </div>
      </nav>
      {open && (
        <ul className="grid grid-cols-2 gap-1 border-t border-line bg-ink px-4 py-4 xl:hidden">
          {[...links, ["/login", "Ingresar"], ["/registro", "Registro"]].map(([h, l]) => (
            <li key={h}><Link onClick={() => setOpen(false)} className="block rounded-lg px-3 py-3 hover:bg-graphite" href={h}>{l}</Link></li>
          ))}
        </ul>
      )}
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-line px-4 py-14 md:px-8">
      <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-4">
        <div className="md:col-span-2">
          <p className="display text-5xl">Beyond<br /><span className="text-lime">your limits</span></p>
          <p className="mt-4 text-sm text-mute">{gym.city} · <a className="underline" href={gym.instagram} target="_blank" rel="noopener">Instagram</a> · <a className="underline" href={gym.tiktok} target="_blank" rel="noopener">TikTok</a> · <a className="underline" href={gym.facebook} target="_blank" rel="noopener">Facebook</a></p>
          <p className="mt-3 text-sm text-mute">Sede Pardo · Cruce de Ppao · 993 538 789</p><p className="text-sm text-mute">Sede Agraria · Av. Naciones Unidas y Agraria · 920 373 854</p><p className="text-sm text-mute">{gym.hours}</p>
        </div>
        <ul className="space-y-2 text-sm text-mute">{links.slice(0, 6).map(([h, l]) => <li key={h}><Link href={h} className="hover:text-bone">{l}</Link></li>)}</ul>
        <ul className="space-y-2 text-sm text-mute">
          {links.slice(6).map(([h, l]) => <li key={h}><Link href={h} className="hover:text-bone">{l}</Link></li>)}
          <li><Link href="/privacidad" className="hover:text-bone">Privacidad (Ley 29733)</Link></li>
        </ul>
      </div>
      <p className="mx-auto mt-10 max-w-7xl text-xs text-mute">© {new Date().getFullYear()} {gym.name}. Plataforma GYMNOVA.</p>
    </footer>
  );
}
