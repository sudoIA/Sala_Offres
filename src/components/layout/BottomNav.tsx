// src/components/layout/BottomNav.tsx
// Barre de navigation mobile inférieure, calquée sur l'application Android Sala.
// Présente sur toutes les pages publiques. Le bouton CV (FAB) reste toujours
// exactement au centre : les liens sont répartis en deux groupes (gauche/
// droite) de part et d'autre, quel que soit le nombre de sections visibles.

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
      <div className="sala-bottom-nav-side">
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
      </div>

      <Link href="/cv-builder" className="sala-bottom-fab" title="Faire un CV">
        <i className="fas fa-pen"></i>
      </Link>

      <div className="sala-bottom-nav-side">
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
      </div>
    </nav>
  );
}
