"use client";
import { useEffect } from "react";
import Script from "next/script";

declare global { interface Window { instgrm?: { Embeds: { process(): void } } } }

// Visor oficial de Instagram (embed.js): muestra publicaciones públicas sin descargar ni copiar contenido.
export function IgEmbeds({ codes }: { codes: readonly string[] }) {
  useEffect(() => { window.instgrm?.Embeds.process(); }, [codes]);
  return (
    <>
      <div className="grid items-start gap-6 md:grid-cols-2 lg:grid-cols-3">
        {codes.map((c) => (
          <div key={c} data-reveal className="overflow-hidden rounded-2xl bg-bone">
            <blockquote className="instagram-media" data-instgrm-permalink={`https://www.instagram.com/p/${c}/`} data-instgrm-version="14" style={{ margin: 0, width: "100%", minWidth: 0, border: 0 }}>
              <a href={`https://www.instagram.com/p/${c}/`} target="_blank" rel="noopener" className="block p-6 text-ink">Ver publicación en Instagram</a>
            </blockquote>
          </div>
        ))}
      </div>
      <Script src="https://www.instagram.com/embed.js" strategy="lazyOnload" onLoad={() => window.instgrm?.Embeds.process()} />
    </>
  );
}
