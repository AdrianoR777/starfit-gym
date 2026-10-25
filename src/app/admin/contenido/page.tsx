import { requireStaff, NotConfigured } from "@/lib/guard";
import SiteForm from "@/components/SiteForm";
import { getSite } from "@/lib/site";
export const metadata = { title: "Contenido web" };
export default async function Page() {
  const { sb } = await requireStaff(["owner", "admin"]);
  if (!sb) return <main className="p-8"><NotConfigured /></main>;
  return (<main id="main" className="mx-auto max-w-5xl space-y-6 px-4 py-8 md:px-8">
    <header><p className="eyebrow">CMS</p><h1 className="display mt-2 text-5xl">Contenido web</h1><p className="mt-2 text-sm text-mute">Los cambios se publican al guardar. Sedes, planes y clases se gestionan en sus propias tablas.</p></header>
    <SiteForm s={await getSite()} />
  </main>);
}
