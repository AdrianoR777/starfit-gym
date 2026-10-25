import { Nav, Footer } from "@/components/Nav";
import { logoSrc } from "@/lib/brand";
import { SmoothScroll, PageMotion } from "@/components/Motion";
export const revalidate = 300;
export default async function L({ children }: { children: React.ReactNode }) {
  return (<><SmoothScroll /><PageMotion /><Nav logo={await logoSrc()} /><main id="main">{children}</main><Footer /></>);
}
