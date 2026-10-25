"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger, SplitText);

// Desplazamiento fluido global (una sola instancia)
export function SmoothScroll() {
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({ lerp: 0.09 });
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (t: number) => lenis.raf(t * 1000);
    gsap.ticker.add(tick); gsap.ticker.lagSmoothing(0);
    return () => { gsap.ticker.remove(tick); lenis.destroy(); };
  }, []);
  return null;
}

// Animaciones declarativas por atributos: data-split, data-reveal, data-parallax, data-zoom, data-bg
export function PageMotion() {
  const path = usePathname();
  useEffect(() => {
    window.scrollTo(0, 0);
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      document.querySelectorAll<HTMLElement>("[data-split]").forEach((el) => {
        const s = SplitText.create(el, { type: "lines,chars", mask: "lines" });
        gsap.from(s.chars, { yPercent: 115, duration: 1.2, ease: "expo.out", stagger: 0.02, delay: 0.35 });
      });
      gsap.utils.toArray<HTMLElement>("[data-fade]").forEach((el, i) =>
        gsap.from(el, { y: 30, opacity: 0, duration: 1, ease: "power3.out", delay: 0.7 + i * 0.1 }));
      // fondo del hero: entra con zoom y se desplaza con el scroll
      gsap.utils.toArray<HTMLElement>("[data-bg]").forEach((el) => {
        gsap.fromTo(el, { scale: 1.25 }, { scale: 1, duration: 2.2, ease: "power3.out" });
        gsap.to(el, { yPercent: 18, ease: "none", scrollTrigger: { trigger: el.parentElement, start: "top top", end: "bottom top", scrub: true } });
      });
      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) =>
        gsap.from(el, { y: 70, opacity: 0, duration: 1.1, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 88%" } }));
      gsap.utils.toArray<HTMLElement>("[data-zoom]").forEach((el) => {
        gsap.fromTo(el, { clipPath: "inset(18% 12% 18% 12% round 28px)" }, { clipPath: "inset(0% 0% 0% 0% round 20px)", ease: "none", scrollTrigger: { trigger: el, start: "top 95%", end: "top 35%", scrub: true } });
        const img = el.querySelector("img, video");
        if (img) gsap.fromTo(img, { scale: 1.3 }, { scale: 1, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true } });
      });
      gsap.utils.toArray<HTMLElement>("[data-parallax]").forEach((el) =>
        gsap.fromTo(el, { yPercent: Number(el.dataset.parallax) || 12 }, { yPercent: -(Number(el.dataset.parallax) || 12), ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true } }));
    });
    const t = setTimeout(() => ScrollTrigger.refresh(), 1300);
    return () => { clearTimeout(t); ctx.revert(); };
  }, [path]);
  return null;
}
