// src/components/VisitCounter.tsx
// Compte une visite anonyme par session pour le rapport mensuel admin (voir
// src/lib/site-stats.ts). N'affiche rien.

"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { recordVisit } from "@/lib/site-stats";

export function VisitCounter() {
  const pathname = usePathname();
  useEffect(() => {
    recordVisit(pathname || "/");
  }, [pathname]);
  return null;
}
