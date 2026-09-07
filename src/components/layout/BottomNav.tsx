// src/components/layout/BottomNav.tsx
// Barre de navigation mobile inférieure, calquée sur l'application Android Sala.
// Présente sur toutes les pages publiques.

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSiteSettings } from "@/hooks/useSiteSettings";

export function BottomNav() {
  const pathname = usePathname();
  const settings = useSiteSettings();
  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + "/");

  return (
    <nav className="sala-bottom-nav">
      <Link href="/offres" className={`sala-bottom-nav-item${isActive("/offres") ? " active" : ""}`}>
        <i className="fas fa-briefcase"></i>
        <span>Emplois</span>
      </Link>
      {settings.sectionsVisible.evenements && (
        <Link href="/evenements" className={`sala-bottom-nav-item${isActive("/evenements") ? " active" : ""}`}>
          <i className="fas fa-calendar-alt"></i>
          <span>Événements</span>
        </Link>
      )}
      <Link href="/cv-builder" className="sala-bottom-fab" title="Faire un CV">
        <i className="fas fa-pen"></i>
      </Link>
      {settings.sectionsVisible.entretiens && (
        <Link href="/entretiens" className={`sala-bottom-nav-item${isActive("/entretiens") ? " active" : ""}`}>
          <i className="fas fa-user-tie"></i>
          <span>Entretiens</span>
        </Link>
      )}
      {settings.sectionsVisible.legislation && (
        <Link href="/legislation" className={`sala-bottom-nav-item${isActive("/legislation") ? " active" : ""}`}>
          <i className="fas fa-balance-scale"></i>
          <span>Droit</span>
        </Link>
      )}
    </nav>
  );
}
