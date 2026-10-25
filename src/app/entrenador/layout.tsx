import Link from "next/link";
export const dynamic = "force-dynamic";
export default function L({ children }: { children: React.ReactNode }) {
  return (<><nav aria-label="Entrenador" className="border-b border-line"><div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-8">
    <Link href="/entrenador" className="display text-xl">Panel <span className="text-lime">entrenador</span></Link>
    <form action="/auth/signout" method="post"><button className="text-sm text-mute hover:text-bone">Cerrar sesión</button></form></div></nav>
    <main id="main" className="mx-auto max-w-6xl px-4 py-8 md:px-8">{children}</main></>);
}
