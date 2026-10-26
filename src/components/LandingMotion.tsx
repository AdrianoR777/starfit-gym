"use client";

import { useEffect, useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(ScrollTrigger, SplitText);

export default function LandingMotion({ children, className }: { children: ReactNode; className: string }) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const abort = new AbortController();
    const timers: ReturnType<typeof setTimeout>[] = [];
    const panels = Array.from(el.querySelectorAll<HTMLElement>(".panel"));
    const open = (panel: HTMLElement) => panels.forEach(p => {
      p.classList.toggle("open", p === panel);
      p.querySelector<HTMLElement>(".p-body")?.toggleAttribute("inert", p !== panel);
    });
    panels.forEach(panel => {
      panel.addEventListener("click", () => open(panel), { signal: abort.signal });
      panel.addEventListener("keydown", e => { if (e.target === panel && ["Enter", " "].includes(e.key)) { e.preventDefault(); open(panel); } }, { signal: abort.signal });
      if (matchMedia("(hover: hover)").matches) panel.addEventListener("pointerenter", () => open(panel), { signal: abort.signal });
    });
    if (panels[0]) open(panels[0]);
    el.querySelectorAll<HTMLButtonElement>(".copy").forEach(button => {
      button.addEventListener("click", async () => {
        const number = button.previousElementSibling;
        if (!number) return;
        try {
          await navigator.clipboard.writeText(number.textContent?.replace(/\s/g, "") ?? "");
          if (abort.signal.aborted) return;
          button.textContent = "Copiado";
          timers.push(setTimeout(() => { button.textContent = "Copiar"; }, 1600));
        } catch {
          const range = document.createRange(); range.selectNodeContents(number);
          getSelection()?.removeAllRanges(); getSelection()?.addRange(range);
        }
      }, { signal: abort.signal });
    });
    const mm = gsap.matchMedia();
    const ctx = gsap.context(() => {
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        el.classList.add("motion-ready");
        const q = gsap.utils.selector(el);
        const scrub = (trigger: Element, start = "top bottom", end = "bottom top") => ({ trigger, start, end, scrub: true });
        const title = SplitText.create(q("#title"), { type: "words,chars", wordsClass: "w", charsClass: "ch" });
        gsap.from(title.words, { yPercent: 110, opacity: 0, stagger: .08, duration: 1.3, ease: "expo.out" });
        gsap.from(q(".hero-foot > *"), { y: 26, opacity: 0, duration: 1, delay: .35, stagger: .12 });
        gsap.fromTo(q(".hero video"), { scale: 1.25 }, { scale: 1.02, duration: 2.4 });
        const hero = el.querySelector(".hero")!;
        gsap.to(q(".hero .wrap"), { yPercent: -18, opacity: .2, ease: "none", scrollTrigger: scrub(hero, "top top") });
        el.querySelectorAll<HTMLElement>(".bg[data-speed]").forEach(bg => gsap.fromTo(bg, { yPercent: -Number(bg.dataset.speed) / 2 }, { yPercent: Number(bg.dataset.speed) / 2, ease: "none", scrollTrigger: scrub(bg.parentElement!) }));
        const manifesto = el.querySelector("#manifesto")!;
        const words = SplitText.create(manifesto, { type: "words", wordsClass: "wd" });
        gsap.to(words.words, { opacity: 1, stagger: .1, ease: "none", scrollTrigger: scrub(manifesto, "top 80%", "bottom 45%") });
        el.querySelectorAll(".panel, .rv").forEach(item => gsap.from(item, { y: 60, opacity: 0, duration: 1.1, scrollTrigger: { trigger: item, start: "top 88%", once: true } }));
        const hours = el.querySelector(".hours")!;
        gsap.timeline({ scrollTrigger: { trigger: hours, start: "top top", end: "+=100%", scrub: true, pin: true } })
          .to(q(".hours .frame"), { clipPath: "inset(0% 0% round 0px)", ease: "none" })
          .from(q(".hours .txt > *"), { y: 45, opacity: 0, stagger: .1 }, 0)
          .from(q(".day .open-range"), { scaleX: 0 }, .3);
        el.querySelectorAll(".zm").forEach(item => {
          gsap.fromTo(item, { clipPath: "inset(16% 10% round 28px)" }, { clipPath: "inset(0% 0% round 22px)", ease: "none", scrollTrigger: scrub(item, "top 95%", "top 45%") });
          gsap.fromTo(item.querySelector("img"), { scale: 1.3 }, { scale: 1, ease: "none", scrollTrigger: scrub(item) });
        });
        return () => { title.revert(); words.revert(); el.classList.remove("motion-ready"); };
      });
      mm.add("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)", () => {
        const hoverEvents = new AbortController();
        panels.forEach(panel => {
          panel.classList.add("spot");
          panel.addEventListener("pointermove", e => { const rect = panel.getBoundingClientRect(); panel.style.setProperty("--mx", `${e.clientX - rect.left}px`); panel.style.setProperty("--my", `${e.clientY - rect.top}px`); }, { signal: hoverEvents.signal });
        });
        el.querySelectorAll<HTMLElement>(".ch").forEach(char => {
          char.addEventListener("pointerenter", () => char.classList.add("on"), { signal: hoverEvents.signal });
          char.addEventListener("pointerleave", () => char.classList.remove("on"), { signal: hoverEvents.signal });
        });
        return () => { hoverEvents.abort(); panels.forEach(panel => panel.classList.remove("spot")); };
      });
      mm.add("(min-width: 761px) and (prefers-reduced-motion: no-preference)", () => {
        const track = el.querySelector<HTMLElement>(".track")!;
        const trigger = el.querySelector("#classes")!;
        const distance = () => Math.max(0, track.scrollWidth - el.clientWidth);
        gsap.to(track, { x: () => -distance(), ease: "none", scrollTrigger: { trigger, start: "center center", end: () => `+=${distance()}`, pin: true, scrub: 1, invalidateOnRefresh: true } });
        gsap.to(el.querySelector(".prog i"), { scaleX: 1, scrollTrigger: { trigger, start: "center center", end: () => `+=${distance()}`, scrub: true, invalidateOnRefresh: true } });
      });
    }, el);
    let mounted = true;
    document.fonts.ready.then(() => { if (mounted) ScrollTrigger.refresh(); });
    const refresh = () => ScrollTrigger.refresh();
    el.querySelectorAll("img").forEach(img => img.addEventListener("load", refresh, { signal: abort.signal, once: true }));
    timers.push(setTimeout(refresh, 800));
    return () => { mounted = false; abort.abort(); timers.forEach(clearTimeout); mm.revert(); ctx.revert(); };
  }, []);
  return <div ref={root} className={`starfit-landing ${className}`}>{children}</div>;
}
