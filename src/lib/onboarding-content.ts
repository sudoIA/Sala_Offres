// src/lib/onboarding-content.ts
// Les diapositives de découverte de Sala : une intro (le problème que Sala
// résout) puis une diapositive par mission de l'ONG (reprises de la page
// "À propos"), et enfin les deux fonctionnalités pratiques (entretiens,
// hors-ligne). Le compteur "N / total" est calculé depuis la longueur du
// tableau, pas stocké ici, pour ne jamais désynchroniser.

interface BaseSlide {
  title: string;
  description: string;
  btnText: string;
}

export interface IconSlide extends BaseSlide {
  kind: "icon";
  icon: string;
  themeColors: { bg: string; color: string };
}

export interface PhotoSlide extends BaseSlide {
  kind: "photo";
  image: string;
  imageAlt: string;
}

export type OnboardingSlide = IconSlide | PhotoSlide;

export const ONBOARDING_SLIDES: OnboardingSlide[] = [
  {
    kind: "photo",
    image: "/img/probleme-emploi-congo.jpg",
    imageAlt: "Un jeune congolais découragé par sa recherche d'emploi",
    title: "Cette question, on l'entend tous les jours.",
    description:
      "Annonces éparpillées, candidatures sans réponse, offres douteuses... chercher du travail au Congo peut vite décourager. Sala est là pour changer ça.",
    btnText: "Découvrir comment",
  },
  {
    kind: "icon",
    icon: "fas fa-briefcase",
    themeColors: { bg: "#eaf6ed", color: "var(--sala-green)" },
    title: "Des offres d'emploi quotidiennes",
    description:
      "La publication des offres d'emploi et de stages disponibles en République du Congo, vérifiées et mises à jour chaque jour.",
    btnText: "Suivant",
  },
  {
    kind: "icon",
    icon: "fas fa-file-alt",
    themeColors: { bg: "#fee2e2", color: "var(--sala-red)" },
    title: "Générateur de CV professionnel",
    description:
      "Créez votre CV directement sur l'application, enregistrez-le en PDF sur votre téléphone, puis partagez-le par e-mail ou sur les réseaux sociaux.",
    btnText: "Suivant",
  },
  {
    kind: "icon",
    icon: "fas fa-building",
    themeColors: { bg: "#e0f2fe", color: "#0284c7" },
    title: "Annuaire des entreprises",
    description: "Consultez l'annuaire de toutes les entreprises du Congo, avec leurs coordonnées et leurs activités.",
    btnText: "Suivant",
  },
  {
    kind: "icon",
    icon: "fas fa-graduation-cap",
    themeColors: { bg: "#ede9fe", color: "#7c3aed" },
    title: "Écoles, universités & filières",
    description:
      "Découvrez tous les établissements d'enseignement supérieur et professionnel du Congo, avec leurs domaines d'études respectifs.",
    btnText: "Suivant",
  },
  {
    kind: "icon",
    icon: "fas fa-route",
    themeColors: { bg: "#fefce8", color: "#b45309" },
    title: "Débouchés par filière",
    description:
      "Pour chaque filière de formation, retrouvez les débouchés possibles : descriptions de poste et compétences requises.",
    btnText: "Suivant",
  },
  {
    kind: "icon",
    icon: "fas fa-comments",
    themeColors: { bg: "#ccfbf1", color: "#0d9488" },
    title: "Clubs d'anglais",
    description: "Trouvez tous les clubs d'anglais du Congo, avec leurs adresses et leurs contacts.",
    btnText: "Suivant",
  },
  {
    kind: "icon",
    icon: "fas fa-lightbulb",
    themeColors: { bg: "#ffedd5", color: "#ea580c" },
    title: "Des astuces pour votre carrière",
    description: "Recevez régulièrement des astuces sur la recherche d'emploi et la gestion de carrière.",
    btnText: "Suivant",
  },
  {
    kind: "icon",
    icon: "fas fa-user-tie",
    themeColors: { bg: "#fce7f3", color: "#db2777" },
    title: "Préparez vos entretiens d'embauche",
    description: "Entraînez-vous avec les questions fréquentes des recruteurs et maîtrisez le droit du travail congolais.",
    btnText: "Suivant",
  },
  {
    kind: "icon",
    icon: "fas fa-wifi",
    themeColors: { bg: "#cffafe", color: "#0891b2" },
    title: "Disponible partout, même hors-ligne",
    description: "Grâce à notre PWA, sauvegardez vos offres favorites et continuez vos démarches même avec un réseau limité.",
    btnText: "Commencer sur Sala 🚀",
  },
];
