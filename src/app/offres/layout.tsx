// src/app/offres/layout.tsx
// Composant serveur : ajoute des métadonnées à la page liste /offres sans
// toucher à page.tsx (qui reste un composant client pour la recherche/les
// filtres/le panneau maître-détail en temps réel).

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Offres d'emploi — Sala",
  description:
    "Toutes les offres d'emploi et de stage actives au Congo (Brazzaville, Pointe-Noire), publiées par l'ONG Sala.",
};

export default function OffresLayout({ children }: { children: React.ReactNode }) {
  return children;
}
