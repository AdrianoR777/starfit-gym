"use client";
import { useActionState } from "react";
import Link from "next/link";
import { signIn, signUp, requestReset, setNewPassword } from "@/lib/actions";

const Msg = ({ s }: { s?: { error?: string; ok?: string } }) => s?.error ? <p role="alert" className="text-sm text-red-400">{s.error}</p> : s?.ok ? <p role="status" className="text-sm text-lime">{s.ok}</p> : null;

export function LoginForm({ next }: { next?: string }) {
  const [s, act, pending] = useActionState(signIn, undefined);
  return (
    <form action={act} className="space-y-4">
      <input type="hidden" name="next" value={next ?? ""} />
      <label className="block"><span className="text-sm text-mute">Correo</span><input className="field mt-1" name="email" type="email" autoComplete="email" required /></label>
      <label className="block"><span className="text-sm text-mute">Contraseña</span><input className="field mt-1" name="password" type="password" autoComplete="current-password" required /></label>
      <Msg s={s} />
      <button disabled={pending} className="btn btn-lime w-full justify-center">{pending ? "Ingresando…" : "Ingresar"}</button>
      <p className="text-center text-sm text-mute"><Link href="/recuperar" className="underline">¿Olvidaste tu contraseña?</Link> · ¿Sin cuenta? <Link href="/registro" className="text-bone underline">Regístrate</Link></p>
    </form>
  );
}

export function SignupForm() {
  const [s, act, pending] = useActionState(signUp, undefined);
  return (
    <form action={act} className="space-y-4">
      <label className="block"><span className="text-sm text-mute">Nombre completo</span><input className="field mt-1" name="full_name" autoComplete="name" required /></label>
      <label className="block"><span className="text-sm text-mute">Correo</span><input className="field mt-1" name="email" type="email" autoComplete="email" required /></label>
      <label className="block"><span className="text-sm text-mute">Celular</span><input className="field mt-1" name="phone" type="tel" inputMode="tel" placeholder="+51 9XXXXXXXX" required /></label>
      <label className="block"><span className="text-sm text-mute">Contraseña (mín. 10)</span><input className="field mt-1" name="password" type="password" autoComplete="new-password" minLength={10} required /></label>
      <label className="flex gap-3 text-sm text-mute"><input type="checkbox" name="terms" className="mt-1 accent-[#C9FF43]" required />Acepto los términos y la <Link href="/privacidad" className="underline">política de privacidad</Link> (Ley 29733).</label>
      <Msg s={s} />
      <button disabled={pending} className="btn btn-lime w-full justify-center">{pending ? "Creando…" : "Crear cuenta"}</button>
    </form>
  );
}
export function ResetRequestForm() {
  const [s, act, pending] = useActionState(requestReset, undefined);
  return (<form action={act} className="space-y-4">
    <label className="block"><span className="text-sm text-mute">Correo de tu cuenta</span><input id="r-email" className="field mt-1" name="email" type="email" autoComplete="email" required /></label>
    <Msg s={s} /><button disabled={pending} className="btn btn-lime w-full justify-center">{pending ? "Enviando…" : "Enviar enlace"}</button>
    <p className="text-center text-sm text-mute"><Link href="/login" className="underline">Volver a ingresar</Link></p></form>);
}
export function NewPasswordForm() {
  const [s, act, pending] = useActionState(setNewPassword, undefined);
  return (<form action={act} className="space-y-4">
    <label className="block"><span className="text-sm text-mute">Nueva contraseña (mín. 10)</span><input id="np-1" className="field mt-1" name="password" type="password" autoComplete="new-password" minLength={10} required /></label>
    <label className="block"><span className="text-sm text-mute">Repite la contraseña</span><input id="np-2" className="field mt-1" name="confirm" type="password" autoComplete="new-password" required /></label>
    <Msg s={s} /><button disabled={pending} className="btn btn-lime w-full justify-center">{pending ? "Guardando…" : "Guardar contraseña"}</button></form>);
}
export { Msg };
