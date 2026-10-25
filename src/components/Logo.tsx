import { gym } from "@/lib/config";

// Logo oficial si existe (public/brand/logo.* o NEXT_PUBLIC_LOGO_URL); si no, logotipo tipográfico.
export function Logo({ src, className = "h-11" }: { src?: string | null; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  if (src) return <img src={src} alt={gym.name} className={`${className} w-auto object-contain`} />;
  return <span className="display text-xl">{gym.name.replace(/\s+gym$/i, "")}<span className="text-lime">★</span></span>;
}
