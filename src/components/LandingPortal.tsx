"use client";

import Link from "next/link";
import { useState } from "react";
import { House, Activity, CalendarDays, Dumbbell, ChartNoAxesColumnIncreasing } from "lucide-react";

const tabs = [
  { id: "inicio", name: "Inicio", icon: House, title: "Tu entrenamiento, en un solo lugar", text: "Accede a tu membresía, credencial digital, reservas y rutina desde tu portal personal.", href: "/portal", action: "Abrir mi portal" },
  { id: "aforo", name: "Aforo", icon: Activity, title: "Elige tu momento para entrenar", text: "Consulta la ocupación por sede y el historial de afluencia disponible.", href: "/ocupacion", action: "Consultar aforo" },
  { id: "clases", name: "Clases", icon: CalendarDays, title: "Haz espacio para tu próxima clase", text: "Consulta los horarios y gestiona tus reservas y listas de espera desde tu cuenta.", href: "/portal/reservas", action: "Ver mis reservas" },
  { id: "maquinas", name: "Máquinas", icon: Dumbbell, title: "Tu turno, sin perder el ritmo", text: "Consulta el estado de los equipos, solicita un turno o reporta una falla.", href: "/portal/maquinas", action: "Consultar máquinas" },
  { id: "registro", name: "Progreso", icon: ChartNoAxesColumnIncreasing, title: "Cada sesión cuenta", text: "Revisa tu rutina y registra tus entrenamientos en tu espacio privado.", href: "/portal/entrenamientos", action: "Ver mis entrenamientos" },
] as const;

export default function LandingPortal({ configured }: { configured: boolean }) {
  const [active, setActive] = useState(0);
  return <section className="app-s" id="app"><div className="wrap">
    <div className="head"><h2 className="d">La app <span className="lime">Starfit</span></h2><p>Aforo, reservas, turnos de máquinas y tu registro de entrenamiento.</p></div>
    <div className="window">
      <div className="chrome" aria-hidden="true"><span className="lights"><i /><i /><i /></span><span className="url">STARFIT · Portal de socios</span><span className="chrome-r">Tu espacio personal</span></div>
      <div className="shell">
        <aside className="side">
          <div className="side-brand"><div><b>STARFIT</b><span className="live">Portal de socios</span></div></div>
          <div className="nav" role="tablist" aria-label="Funciones de la app">
            {tabs.map((tab, i) => <button key={tab.id} id={`tab-${tab.id}`} role="tab" type="button" aria-selected={active === i} aria-controls={`pane-${tab.id}`} tabIndex={active === i ? 0 : -1} onClick={() => setActive(i)} onKeyDown={(e) => {
              const next = e.key === "ArrowRight" || e.key === "ArrowDown" ? (i + 1) % tabs.length : e.key === "ArrowLeft" || e.key === "ArrowUp" ? (i + tabs.length - 1) % tabs.length : e.key === "Home" ? 0 : e.key === "End" ? tabs.length - 1 : null;
              if (next !== null) { e.preventDefault(); setActive(next); document.getElementById(`tab-${tabs[next].id}`)?.focus(); }
            }}><tab.icon aria-hidden="true" /><span>{tab.name}</span></button>)}
          </div>
          <nav className="nav" aria-label="Acceso del personal"><Link href="/recepcion">Recepción →</Link><Link href="/entrenador">Entrenadores →</Link><Link href="/admin">Administración →</Link></nav>
        </aside>
        <div className="main">
          <div className="topbar"><div><p className="eyebrow">Bienvenido a Starfit</p><h3>{tabs[active].name}</h3></div><Link href="/login" className="btn btn-lime sm">Ingresar</Link></div>
          <p className="app-status">{configured ? "Inicia sesión para acceder a tus datos personales." : "El portal de socios está pendiente de activación. Consulta las inscripciones por WhatsApp."}</p>
          {tabs.map((tab, i) => <div key={tab.id} className="pane" id={`pane-${tab.id}`} role="tabpanel" aria-labelledby={`tab-${tab.id}`} hidden={active !== i} tabIndex={0}>
            <div className="box"><div className="card-h"><span className="ico"><tab.icon aria-hidden="true" /></span><span className="pill">STARFIT GYM</span></div><h4>{tab.title}</h4><p className="muted">{tab.text}</p><Link className="btn btn-lime sm" href={tab.href}>{tab.action} →</Link></div>
            <div className="grid2" style={{ marginTop: 14 }}><div className="box"><p className="eyebrow">Tu membresía</p><h4>Entrena a tu manera</h4><p className="muted">Consulta los planes y las condiciones de tu membresía.</p><Link href="/membresias" className="btn btn-ghost sm">Ver membresías</Link></div><div className="box"><p className="eyebrow">Tu próxima clase</p><h4>Muévete en comunidad</h4><p className="muted">Encuentra una clase para ti en Pardo o Agraria.</p><Link href="/horarios" className="btn btn-ghost sm">Ver horarios</Link></div></div>
            <div className="portal-links"><Link href="/registro">Crear cuenta →</Link><Link href="/portal/credencial">Mi credencial QR →</Link><Link href="/portal/notificaciones">Notificaciones →</Link></div>
          </div>)}
        </div>
      </div>
    </div>
  </div></section>;
}
