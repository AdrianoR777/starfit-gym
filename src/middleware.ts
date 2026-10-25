import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({ request: req });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return res;
  const sb = createServerClient(url, key, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (list) => { res = NextResponse.next({ request: req }); list.forEach(({ name, value, options }) => res.cookies.set(name, value, options)); },
    },
  });
  const { data: { user } } = await sb.auth.getUser();
  const priv = ["/portal", "/recepcion", "/admin", "/entrenador"].some((p) => req.nextUrl.pathname.startsWith(p));
  if (priv && !user) return NextResponse.redirect(new URL(`/login?next=${req.nextUrl.pathname}`, req.url));
  res.headers.set("Cache-Control", priv ? "private, no-store" : res.headers.get("Cache-Control") ?? "");
  return res;
}
export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|svg|webp)$).*)"] };
