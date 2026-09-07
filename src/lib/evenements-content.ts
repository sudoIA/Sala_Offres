// src/lib/evenements-content.ts
// Événements de base vérifiés au Congo (Salons, Ateliers ONG Sala, Tech & Langues),
// utilisés en repli si la collection Firestore "evenements" est vide/inaccessible.

import type { SalaEvent } from "@/types/event";

export const baselineEvenements: SalaEvent[] = [
  {
    id: "evt-salon-brazza-2025",
    title: "Salon de l'Emploi & des Métiers d'Avenir de Brazzaville",
    category: "Salon",
    organizer: "ONG Sala & Partenaires Institutionnels",
    date: "25 Octobre 2026",
    isoDate: "2026-10-25T09:00:00",
    time: "09h00 - 17h00",
    city: "Brazzaville",
    location: "Palais des Congrès de Brazzaville",
    price: "Entrée Gratuite",
    badgeColor: "success",
    description:
      "Rencontrez plus de 45 recruteurs (télécoms, banques, pétrole, logistique, numérique) et déposez directement vos CV imprimés ou via QR code Sala.",
    highlights: ["Stands recruteurs", "Speed-recruiting", "Ateliers relecture de CV"],
    registrationRequired: true,
  },
  {
    id: "evt-atelier-cv-pnr",
    title: "Masterclass CV Gagnant & Simulation d'Entretien",
    category: "Atelier",
    organizer: "ONG Sala - Antenne Pointe-Noire",
    date: "12 Novembre 2026",
    isoDate: "2026-11-12T14:00:00",
    time: "14h00 - 17h30",
    city: "Pointe-Noire",
    location: "Espace Créatif & Co-working, Centre-ville",
    price: "Gratuit (Sur inscription)",
    badgeColor: "primary",
    description:
      "Atelier pratique interactif pour maîtriser la rédaction de CV aux normes internationales et réussir ses entretiens face aux DRH.",
    highlights: ["Correction personnalisée", "Mises en situation filmées", "Guide PDF offert"],
    registrationRequired: true,
  },
  {
    id: "evt-webinaire-ia",
    title: "Webinaire : L'Intelligence Artificielle & les Nouveaux Métiers au Congo",
    category: "Webinaire",
    organizer: "Tech Hub Congo & ONG Sala",
    date: "28 Novembre 2026",
    isoDate: "2026-11-28T18:00:00",
    time: "18h00 - 19h30 (Heure de Brazzaville)",
    city: "En ligne",
    location: "Google Meet / YouTube Live",
    price: "100% En Ligne",
    badgeColor: "info",
    description:
      "Découvrez les compétences technologiques les plus recherchées par les entreprises régionales et internationales en télétravail.",
    highlights: ["Intervenants experts internationaux", "Session Q&R en direct", "Replay accessible"],
    registrationRequired: false,
  },
  {
    id: "evt-forum-mines-pnr",
    title: "Carrefour Emploi Logistique, Port & Énergies",
    category: "Salon",
    organizer: "Chambre de Commerce & Partenaires Portuaires",
    date: "15 Décembre 2026",
    isoDate: "2026-12-15T08:30:00",
    time: "08h30 - 16h00",
    city: "Pointe-Noire",
    location: "Chambre de Commerce de Pointe-Noire",
    price: "Accès libre",
    badgeColor: "warning",
    description:
      "Journée portes ouvertes et recrutement pour les profils techniques, logistiques, maritimes et supply-chain.",
    highlights: ["Entreprises portuaires", "Dépôt instantané de candidatures"],
    registrationRequired: true,
  },
];
