// src/lib/onboarding-content.ts
// Les 4 diapositives de découverte de Sala.

export interface OnboardingSlide {
  counter: string;
  icon: string;
  themeColors: { bg: string; color: string };
  title: string;
  description: string;
  btnText: string;
}

export const ONBOARDING_SLIDES: OnboardingSlide[] = [
  {
    counter: "1 / 4",
    icon: "fas fa-briefcase",
    themeColors: { bg: "#eaf6ed", color: "var(--sala-green)" },
    title: "Des offres d'emploi quotidiennes",
    description:
      "Accédez aux opportunités de recrutement et de stage vérifiées à Brazzaville, Pointe-Noire et partout en République du Congo.",
    btnText: "Suivant",
  },
  {
    counter: "2 / 4",
    icon: "fas fa-file-alt",
    themeColors: { bg: "#fee2e2", color: "var(--sala-red)" },
    title: "Générateur de CV professionnel",
    description:
      "Créez votre CV moderne en 7 étapes intuitives, optimisé pour les recruteurs et téléchargeable gratuitement au format PDF.",
    btnText: "Suivant",
  },
  {
    counter: "3 / 4",
    icon: "fas fa-user-tie",
    themeColors: { bg: "#fefce8", color: "#b45309" },
    title: "Préparez vos entretiens d'embauche",
    description: "Entraînez-vous avec les questions fréquentes des recruteurs et maîtrisez le droit du travail congolais.",
    btnText: "Suivant",
  },
  {
    counter: "4 / 4",
    icon: "fas fa-wifi",
    themeColors: { bg: "#e0f2fe", color: "#0284c7" },
    title: "Disponible partout, même hors-ligne",
    description: "Grâce à notre PWA, sauvegardez vos offres favorites et continuez vos démarches même avec un réseau limité.",
    btnText: "Commencer sur Sala 🚀",
  },
];
