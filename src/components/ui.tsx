import Link from "next/link";
import Image from "next/image";

export type Media = { img?: string; video?: string; alt?: string };

// Fondo cinematográfico: video (con póster) o imagen, con zoom de entrada y parallax
export function Backdrop({ media, dim = 0.55 }: { media: Media; dim?: number }) {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden={!media.alt}>
      <div data-bg className="absolute inset-0 will-change-transform">
        {media.video ? (
          <video className="h-full w-full object-cover" autoPlay muted loop playsInline preload="metadata" poster={media.video.replace(".mp4", ".webp")}>
            <source src={media.video} type="video/mp4" />
          </video>
        ) : media.img ? (
          <Image src={media.img} alt={media.alt ?? ""} fill priority sizes="100vw" className="object-cover" />
        ) : null}
      </div>
      <div className="absolute inset-0 bg-ink" style={{ opacity: dim }} />
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-ink/40" />
      <div className="grain absolute inset-0" />
    </div>
  );
}

export function PageHero({ eyebrow, title, accent, children, media }: { eyebrow: string; title: string; accent?: string; children?: React.ReactNode; media?: Media }) {
  return (
    <section className={`relative overflow-hidden ${media ? "flex min-h-[88svh] items-end" : ""}`}>
      {media && <Backdrop media={media} />}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-16 pt-36 md:px-8 md:pb-24 md:pt-48">
        <p data-fade className="eyebrow">{eyebrow}</p>
        <h1 data-split className="display mt-5 text-[13vw] md:text-9xl break-words">{title}{accent && <><br /><span className="text-lime">{accent}</span></>}</h1>
        {children && <div data-fade className="mt-8 max-w-2xl text-lg text-bone/80">{children}</div>}
      </div>
    </section>
  );
}

// Galería asimétrica con revelado por máscara y parallax
export function Gallery({ items }: { items: { src: string; alt: string; caption?: string }[] }) {
  const spans = ["md:col-span-7 md:row-span-2", "md:col-span-5", "md:col-span-5", "md:col-span-4", "md:col-span-8"];
  return (
    <div className="grid auto-rows-[260px] gap-4 md:grid-cols-12 md:auto-rows-[300px]">
      {items.map((it, i) => (
        <figure key={it.src} data-zoom className={`group relative overflow-hidden rounded-[20px] ${spans[i % spans.length]}`}>
          <Image src={it.src} alt={it.alt} fill sizes="(min-width: 768px) 60vw, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
          {it.caption && <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/90 to-transparent p-5 font-semibold">{it.caption}</figcaption>}
        </figure>
      ))}
    </div>
  );
}

// Banda de video a pantalla completa entre secciones
export function VideoBand({ src, title, accent }: { src: string; title: string; accent?: string }) {
  return (
    <section className="relative my-10 flex h-[80svh] items-center overflow-hidden">
      <div data-parallax="10" className="absolute inset-[-12%_0]">
        <video className="h-full w-full object-cover" autoPlay muted loop playsInline preload="none" poster={src.replace(".mp4", ".webp")}><source src={src} type="video/mp4" /></video>
      </div>
      <div className="absolute inset-0 bg-ink/55" />
      <h2 data-reveal className="display relative z-10 mx-auto max-w-7xl px-4 text-6xl md:px-8 md:text-[9vw]">{title}{accent && <><br /><span className="text-lime">{accent}</span></>}</h2>
    </section>
  );
}

export function Empty({ title, children, cta }: { title: string; children?: React.ReactNode; cta?: [string, string] }) {
  return (
    <div data-reveal className="card border-dashed p-10">
      <p className="text-xl font-semibold">{title}</p>
      {children && <p className="mt-2 text-mute">{children}</p>}
      {cta && <Link href={cta[0]} className="btn btn-ghost mt-6">{cta[1]}</Link>}
    </div>
  );
}
export function Section({ children }: { children: React.ReactNode }) {
  return <section className="mx-auto max-w-7xl px-4 py-20 md:px-8">{children}</section>;
}
export function Pending({ what }: { what: string }) {
  return <p role="status" className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">{what}</p>;
}
export const stockNote = "Imágenes referenciales de stock (Unsplash/Pexels). Reemplazar por fotos reales del gimnasio.";
