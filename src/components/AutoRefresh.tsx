"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
export function AutoRefresh({ seconds = 60 }: { seconds?: number }) {
  const r = useRouter();
  useEffect(() => { const t = setInterval(() => r.refresh(), seconds * 1000); return () => clearInterval(t); }, [r, seconds]);
  return null;
}
