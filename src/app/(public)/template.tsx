"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";

// Transición entre páginas: cortina lima que se retira + entrada del contenido
export default function Template({ children }: { children: React.ReactNode }) {
  const curtain = useRef<HTMLDivElement>(null), body = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { gsap.set(curtain.current, { display: "none" }); return; }
    const tl = gsap.timeline();
    tl.fromTo(curtain.current, { yPercent: 0 }, { yPercent: -100, duration: 0.9, ease: "expo.inOut" })
      .from(body.current, { opacity: 0, y: 40, duration: 0.8, ease: "power3.out", clearProps: "transform,opacity" }, 0.35)
      .set(curtain.current, { display: "none" });
    return () => { tl.kill(); };
  }, []);
  return (<>
    <div ref={curtain} aria-hidden className="pointer-events-none fixed inset-0 z-[60] flex items-center justify-center bg-lime">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/logo.png" alt="" className="h-40 w-40 md:h-56 md:w-56" />
    </div>
    <div ref={body}>{children}</div>
  </>);
}
