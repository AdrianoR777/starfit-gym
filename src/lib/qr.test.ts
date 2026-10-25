import { describe, expect, it } from "vitest";
import { issueToken, verifyToken, QR_TTL_SECONDS } from "./qr";

const S = "test-secret";
describe("QR temporal", () => {
  it("valida un token recién emitido", () => {
    const r = verifyToken(issueToken("abc", S), S);
    expect(r.ok && r.code).toBe("abc");
  });
  it("rechaza tokens vencidos", () => {
    const t = issueToken("abc", S, 0);
    expect(verifyToken(t, S, (QR_TTL_SECONDS + 1) * 1000)).toEqual({ ok: false, reason: "expired" });
  });
  it("rechaza firmas manipuladas", () => {
    const [p] = issueToken("abc", S).split(".");
    expect(verifyToken(`${p}.xxx`, S).ok).toBe(false);
    expect(verifyToken(issueToken("abc", "otro"), S).ok).toBe(false);
  });
  it("emite nonces únicos", () => {
    const a = verifyToken(issueToken("abc", S), S), b = verifyToken(issueToken("abc", S), S);
    expect(a.ok && b.ok && a.nonce !== b.nonce).toBe(true);
  });
});
