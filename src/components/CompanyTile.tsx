// src/components/CompanyTile.tsx
// Pastille colorée avec les initiales d'une entreprise (couleur déterministe).

import { getCompanyTileColor, getInitials } from "@/lib/job-helpers";

export function CompanyTile({ company, large = false }: { company?: string | null; large?: boolean }) {
  const tile = getCompanyTileColor(company);
  return (
    <div
      className={`sala-company-tile${large ? " sala-company-tile-lg" : ""}`}
      style={{ background: tile.bg, color: tile.color }}
    >
      {getInitials(company)}
    </div>
  );
}
