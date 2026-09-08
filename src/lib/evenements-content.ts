// src/lib/evenements-content.ts
// Événements de base, utilisés en repli uniquement si la collection
// Firestore "events" est totalement vide/inaccessible.

import type { SalaEvent } from "@/types/event";

export const baselineEvenements: SalaEvent[] = [
  {
    id: "evt-salon-brazza-2026",
    title: "Salon de l'Emploi & des Métiers d'Avenir de Brazzaville",
    host: "ONG Sala & Partenaires Institutionnels",
    city: "Brazzaville",
    body: "Rencontrez plus de 45 recruteurs (télécoms, banques, pétrole, logistique, numérique) et déposez directement vos CV imprimés ou via QR code Sala. Entrée gratuite, 09h00 - 17h00.",
    deadlineDate: new Date("2026-10-25T09:00:00"),
    deadline2Date: null,
    visibility: true,
  },
  {
    id: "evt-atelier-cv-pnr",
    title: "Masterclass CV Gagnant & Simulation d'Entretien",
    host: "ONG Sala — Antenne Pointe-Noire",
    city: "Pointe-Noire",
    body: "Atelier pratique interactif pour maîtriser la rédaction de CV aux normes internationales et réussir ses entretiens face aux DRH. Gratuit sur inscription, 14h00 - 17h30.",
    deadlineDate: new Date("2026-11-12T14:00:00"),
    deadline2Date: null,
    visibility: true,
  },
  {
    id: "evt-webinaire-ia",
    title: "Webinaire : L'Intelligence Artificielle & les Nouveaux Métiers au Congo",
    host: "Tech Hub Congo & ONG Sala",
    city: "En ligne",
    body: "Découvrez les compétences technologiques les plus recherchées par les entreprises régionales et internationales en télétravail. 100% en ligne, 18h00 - 19h30 (heure de Brazzaville).",
    deadlineDate: new Date("2026-11-28T18:00:00"),
    deadline2Date: null,
    visibility: true,
  },
];
