import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

// Token QR temporal: base64url(payload).firma — payload = código|expiración|nonce
export const QR_TTL_SECONDS = 30;

const sign = (data: string, secret: string) => createHmac("sha256", secret).update(data).digest("base64url");

export function issueToken(code: string, secret: string, now = Date.now()) {
  const exp = Math.floor(now / 1000) + QR_TTL_SECONDS;
  const payload = Buffer.from(`${code}|${exp}|${randomBytes(8).toString("hex")}`).toString("base64url");
  return `${payload}.${sign(payload, secret)}`;
}

export type VerifyResult = { ok: true; code: string; nonce: string } | { ok: false; reason: "malformed" | "bad_signature" | "expired" };

export function verifyToken(token: string, secret: string, now = Date.now()): VerifyResult {
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return { ok: false, reason: "malformed" };
  const expected = Buffer.from(sign(payload, secret));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return { ok: false, reason: "bad_signature" };
  const [code, exp, nonce] = Buffer.from(payload, "base64url").toString().split("|");
  if (!code || !exp || !nonce) return { ok: false, reason: "malformed" };
  if (Number(exp) * 1000 < now) return { ok: false, reason: "expired" };
  return { ok: true, code, nonce };
}
