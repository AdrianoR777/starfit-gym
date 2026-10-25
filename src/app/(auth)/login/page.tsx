import { LoginForm } from "@/components/AuthForms";
export const metadata = { title: "Iniciar sesión" };
export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next, error } = await searchParams;
  return (<><h1 className="display mb-8 mt-10 text-5xl">Ingresar</h1>{error && <p role="alert" className="mb-4 text-sm text-red-400">El enlace no es válido o expiró. Ingresa o solicita uno nuevo.</p>}<LoginForm next={next} /></>);
}
