// src/components/annuaire/AnnuaireLogo.tsx
// Logo d'une fiche annuaire, ou icône par défaut propre à la catégorie
// (chapeau de diplômé pour les écoles, bâtiment pour les entreprises, langue
// pour les clubs d'anglais) quand aucun logo n'est renseigné — utilisé à
// l'identique par la carte et la fiche détail pour qu'elles ne divergent
// jamais.

"use client";

import { CompanyTile } from "@/components/CompanyTile";
import { annuaireCategoryClass } from "@/lib/annuaire-helpers";
import type { AnnuaireCategory } from "@/types/annuaire";

const CATEGORY_ICON: Record<AnnuaireCategory, string> = {
  universities: "fas fa-graduation-cap",
  companies: "fas fa-building",
  clubs: "fas fa-comment-dots",
};

interface AnnuaireLogoProps {
  category: AnnuaireCategory;
  name?: string | null;
  logoUrl?: string | null;
  large?: boolean;
}

export function AnnuaireLogo({ category, name, logoUrl, large = false }: AnnuaireLogoProps) {
  if (logoUrl) {
    return <CompanyTile company={name} logoUrl={logoUrl} large={large} />;
  }
  const cat = annuaireCategoryClass(category);
  return (
    <div className={`card-icon-header icon-${cat}`}>
      <i className={CATEGORY_ICON[category]}></i>
    </div>
  );
}
