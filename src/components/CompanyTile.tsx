// src/components/CompanyTile.tsx
// Logo de l'entreprise si on en a trouvé un (voir resolveCompanyLogoUrl),
// sinon pastille colorée avec ses initiales (couleur déterministe).

"use client";

import { useState } from "react";
import { getCompanyTileColor, getInitials } from "@/lib/job-helpers";

interface CompanyTileProps {
  company?: string | null;
  large?: boolean;
  logoUrl?: string | null;
}

export function CompanyTile({ company, large = false, logoUrl }: CompanyTileProps) {
  const [logoFailed, setLogoFailed] = useState(false);

  if (logoUrl && !logoFailed) {
    return (
      <div className={`sala-company-tile sala-company-tile-logo${large ? " sala-company-tile-lg" : ""}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoUrl} alt={company || "Logo de l'entreprise"} onError={() => setLogoFailed(true)} />
      </div>
    );
  }

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
