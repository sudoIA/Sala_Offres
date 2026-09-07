// src/components/layout/FabCv.tsx
// Bouton flottant "Faire un CV" (masqué sur mobile, remplacé par le FAB
// central de la BottomNav via la media query dans sala-theme.css).

import Link from "next/link";

export function FabCv() {
  return (
    <Link href="/cv-builder" className="sala-fab-cv" title="Faire un CV">
      <i className="fas fa-pen"></i>
      <span className="tooltip-text">Faire un CV professionnel</span>
    </Link>
  );
}
