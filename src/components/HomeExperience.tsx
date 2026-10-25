"use client";
import { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import Image from "next/image";
import { ArrowRight, ArrowDown } from "lucide-react";

gsap.registerPlugin(ScrollTrigger, SplitText);

type Stats = { locations: number | null; zones: number | null; classesWeek: number | null };
const chapters = [
  ["01", "Fuerza", "Placas, racks y barras para construir técnica antes que carga.", "/media/img/deadlift.webp"],
  ["02", "Cardio", "Ritmo controlado, a tu nivel, con espacio para respirar.", "/media/img/facility.webp"],
  ["03", "Funcional", "Movimiento real: empujar, tirar, saltar, estabilizar.", "/media/img/ropes.webp"],
  ["04", "Clases", "Baile, Funcional, Xbox, Zumba y Step con instructores.", "/media/img/group-class.webp"],
];

export default function HomeExperience({ stats, heroVideo, hero }: { stats: Stats; heroVideo: string | null; hero: { title: string; accent: string; subtitle: string; signup: string } }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    const ctx = gsap.context(() => {
      const split = SplitText.create(".hero-title", { type: "chars,lines", mask: "lines" });
      gsap.timeline({ defaults: { ease: "expo.out" } })
        .from(split.chars, { yPercent: 110, duration: 1.4, stagger: 0.025 })
        .from(".hero-sub, .hero-cta", { y: 24, opacity: 0, duration: 1, stagger: 0.1 }, "-=0.9")
        .from(".hero-ring", { scale: 0.6, opacity: 0, duration: 2, ease: "power3.out" }, 0)
        .fromTo(".hero-video", { scale: 1.3, filter: "blur(12px)" }, { scale: 1.05, filter: "blur(0px)", duration: 2.4, ease: "power3.out" }, 0);
      gsap.to(".hero-video", { yPercent: 15, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
      gsap.utils.toArray<HTMLElement>(".chapter-img").forEach((img) =>
        gsap.fromTo(img, { xPercent: -8, scale: 1.2 }, { xPercent: 8, ease: "none", scrollTrigger: { trigger: ".h-pin", start: "top top", end: () => `+=${document.querySelector<HTMLElement>(".h-track")!.scrollWidth}`, scrub: true } }));

      // cámara virtual: el hero se aleja al hacer scroll
      gsap.to(".hero-stage", { scale: 0.86, borderRadius: 32, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
      gsap.to(".hero-ring", { rotate: 120, yPercent: 30, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });

      // manifiesto: palabras que se encienden
      const m = SplitText.create(".manifesto", { type: "words" });
      gsap.fromTo(m.words, { opacity: 0.12 }, { opacity: 1, stagger: 0.1, ease: "none", scrollTrigger: { trigger: ".manifesto", start: "top 75%", end: "bottom 40%", scrub: true } });

      // capítulos horizontales con pin
      const track = document.querySelector<HTMLElement>(".h-track");
      if (track) gsap.matchMedia().add("(min-width: 768px)", () => {
        gsap.to(track, {
          x: () => -(track.scrollWidth - window.innerWidth), ease: "none",
          scrollTrigger: { trigger: ".h-pin", pin: true, scrub: 1, end: () => `+=${track.scrollWidth}`, invalidateOnRefresh: true },
        });
      });

      // revelado por máscara
      gsap.fromTo(".reveal-mask", { clipPath: "inset(30% 30% 30% 30% round 40px)" }, { clipPath: "inset(0% 0% 0% 0% round 0px)", ease: "none",
        scrollTrigger: { trigger: ".reveal", start: "top top", end: "+=120%", scrub: true, pin: true } });
      gsap.from(".reveal-text", { yPercent: 60, opacity: 0, scrollTrigger: { trigger: ".reveal", start: "top top", end: "+=80%", scrub: true } });

      // cifras reales (solo si existen)
      document.querySelectorAll<HTMLElement>("[data-count]").forEach((el) => {
        const to = Number(el.dataset.count); const o = { v: 0 };
        gsap.to(o, { v: to, duration: 1.6, ease: "power2.out", onUpdate: () => (el.textContent = Math.round(o.v).toString()),
          scrollTrigger: { trigger: el, start: "top 85%", once: true } });
      });
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={root}>
      {/* HERO */}
      <section className="hero relative h-[100svh] overflow-hidden">
        <div className="hero-stage grain absolute inset-0 overflow-hidden bg-graphite">
          {heroVideo ? (
            <video className="hero-video absolute inset-0 h-full w-full object-cover opacity-70" autoPlay muted loop playsInline preload="auto" poster={heroVideo.replace(".mp4", ".webp")}>
              <source src={heroVideo} type="video/mp4" />
            </video>
          ) : (
            <svg className="hero-ring absolute left-1/2 top-1/2 h-[140vmin] w-[140vmin] -translate-x-1/2 -translate-y-1/2" viewBox="0 0 400 400" aria-hidden>
              {Array.from({ length: 14 }).map((_, i) => (
                <circle key={i} cx="200" cy="200" r={30 + i * 12} fill="none" stroke={i % 4 === 0 ? "#C9FF43" : "#2a3033"} strokeWidth={i % 4 === 0 ? 1.2 : 0.6} strokeDasharray={i % 2 ? "2 6" : "none"} />
              ))}
              <path d="M200 70 L218 182 L330 200 L218 218 L200 330 L182 218 L70 200 L182 182Z" fill="#C9FF43" opacity=".9" />
            </svg>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
        </div>
        <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-end px-4 pb-16 md:px-8 md:pb-24">
          <p className="eyebrow mb-6">STARFIT GYM · Nuevo Chimbote</p>
          <h1 className="hero-title display text-[17vw] md:text-[12vw]">{hero.title}<br /><span className="text-lime">{hero.accent}</span></h1>
          <div className="mt-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <p className="hero-sub max-w-md text-lg text-mute">{hero.subtitle}</p>
            <div className="hero-cta flex flex-wrap gap-3">
              <Link href="/membresias" className="btn btn-lime">Explorar membresías <ArrowRight size={18} /></Link>
              <Link href="/instalaciones" className="btn btn-ghost">Conocer el gimnasio</Link>
            </div>
          </div>
          <ArrowDown className="mx-auto mt-10 animate-bounce text-mute" aria-hidden />
        </div>
      </section>

      {/* MANIFIESTO */}
      <section className="mx-auto max-w-6xl px-4 py-32 md:px-8 md:py-48">
        <p className="eyebrow mb-8">Manifiesto</p>
        <p className="manifesto text-3xl font-semibold leading-tight md:text-6xl">
          Porque estar fit no es solo verse bien, sino sentirse bien. No venimos a prometer cuerpos perfectos: venimos a entrenar mejor, con técnica, constancia y un equipo que conoce tu nombre. Cada sesión cuenta, incluido el descanso.
        </p>
      </section>

      {/* CAPÍTULOS HORIZONTALES */}
      <section className="h-pin relative overflow-hidden" aria-label="Espacios de entrenamiento">
        <div className="h-track flex h-[100svh] w-max items-center gap-6 px-4 md:gap-10 md:px-8 max-md:flex-col max-md:h-auto max-md:w-full max-md:py-10">
          <div className="w-[80vw] shrink-0 md:w-[40vw] max-md:w-full">
            <p className="eyebrow">El espacio</p>
            <h2 className="display mt-4 text-6xl md:text-8xl">Cuatro<br />formas de<br /><span className="text-lime">moverte</span></h2>
          </div>
          {chapters.map(([n, t, d, img]) => (
            <article key={n} className="group relative flex h-[72svh] w-[80vw] shrink-0 flex-col justify-between overflow-hidden rounded-[24px] p-8 md:w-[38vw] max-md:w-full max-md:h-[60svh]">
              <Image src={img} alt={t} fill sizes="(min-width:768px) 40vw, 100vw" className="chapter-img object-cover transition duration-700 group-hover:brightness-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-ink/10" />
              <span className="display relative text-[9rem] text-bone/25">{n}</span>
              <div className="relative"><h3 className="display text-5xl">{t}</h3><p className="mt-3 max-w-sm text-bone/80">{d}</p></div>
            </article>
          ))}
        </div>
      </section>

      {/* REVELADO */}
      <section className="reveal relative h-[100svh] overflow-hidden">
        <div className="reveal-mask grain absolute inset-0 bg-ink">
          <video className="h-full w-full object-cover opacity-50" autoPlay muted loop playsInline preload="none" poster="/media/video/intensity.webp"><source src="/media/video/intensity.mp4" type="video/mp4" /></video>
          <div className="absolute inset-0 bg-gradient-to-b from-ink/40 via-transparent to-ink" />
        </div>
        <div className="reveal-text relative z-10 flex h-full flex-col items-center justify-center px-4 text-center">
          <p className="eyebrow !text-lime">Tu progreso, tus reglas</p>
          <h2 className="display mt-4 text-[14vw] md:text-[9vw]">Entrena<br />conectado</h2>
          <p className="mt-6 max-w-xl text-lg text-bone/85">Reserva clases, accede con QR temporal y sigue tu constancia desde el portal del miembro.</p>
        </div>
      </section>

      {/* CIFRAS REALES */}
      <section className="mx-auto max-w-7xl px-4 py-28 md:px-8">
        <p className="eyebrow mb-10">En cifras · datos del sistema</p>
        <dl className="grid gap-px overflow-hidden rounded-3xl border border-line bg-line md:grid-cols-3">
          {([["Sedes activas", stats.locations], ["Zonas de entrenamiento", stats.zones], ["Clases esta semana", stats.classesWeek]] as const).map(([l, v]) => (
            <div key={l} className="bg-ink p-10">
              <dt className="text-mute">{l}</dt>
              <dd className="display mt-4 text-7xl">{v === null ? <span className="text-3xl text-mute">Sin datos aún</span> : <span data-count={v}>{v}</span>}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-32 md:px-8">
        <div className="card flex flex-col items-start gap-8 p-10 md:flex-row md:items-center md:justify-between md:p-16">
          <h2 className="display text-5xl md:text-7xl">Empieza<br /><span className="text-lime">hoy</span></h2>
          <div className="flex flex-wrap gap-3"><Link href="/registro" className="btn btn-lime">Crear cuenta <ArrowRight size={18} /></Link><a href={hero.signup} target="_blank" rel="noopener" className="btn btn-ghost">Solicitar información</a></div>
        </div>
      </section>
    </div>
  );
}
