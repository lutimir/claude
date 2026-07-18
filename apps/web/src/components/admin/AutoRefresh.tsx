"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Obnovuje serverové dáta stránky, kým beží import vo fronte. */
export function AutoRefresh({ active, intervalMs = 4000 }: { active: boolean; intervalMs?: number }) {
  const router = useRouter();
  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(timer);
  }, [active, intervalMs, router]);
  return null;
}
