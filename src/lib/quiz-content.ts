// src/lib/quiz-content.ts
// Questions de quiz d'origine, avec des identifiants fixes (entretiens-01...,
// droit-01...). Celles du droit du travail reprennent uniquement le contenu
// des fiches du guide (src/lib/legislation-content.ts).
// Servent à remplir la collection "quiz" une première fois (Admin > Quiz) et
// de repli si la base est vide ou inaccessible (site et API).

import { QUIZ_QUESTIONS } from "@/lib/entretiens-content";
import type { QuizOption, QuizQuestion } from "@/types/quiz";

const INTERVIEW_QUIZ: QuizQuestion[] = QUIZ_QUESTIONS.map((q, i) => ({
  id: `entretiens-${String(i + 1).padStart(2, "0")}`,
  theme: "entretiens",
  question: q.question,
  options: q.options,
  order: i + 1,
}));

/** Une bonne réponse (`ok`) et ses explications. */
function opt(text: string, correct: boolean, explanation: string): QuizOption {
  return { text, correct, explanation };
}

const LABOR_QUESTIONS: { question: string; options: QuizOption[] }[] = [
  {
    question: "Vous êtes employé de bureau en période d'essai. Quelle est sa durée maximale ?",
    options: [
      opt("1 mois", true, "Pour les ouvriers et employés, la période d'essai est de 1 mois maximum, renouvelable une seule fois par écrit."),
      opt("3 mois", false, "3 mois, c'est le maximum pour les cadres supérieurs. Pour un employé, c'est 1 mois."),
      opt("6 mois", false, "Aucune catégorie n'a 6 mois d'essai. Pour un employé, c'est 1 mois maximum."),
    ],
  },
  {
    question: "Votre CDD est terminé, mais vous continuez à travailler sans nouveau contrat. Que se passe-t-il ?",
    options: [
      opt("Vous travaillez sans contrat, à vos risques", false, "Non : la loi vous protège. Le contrat continue sous une autre forme."),
      opt("Votre contrat devient un CDI", true, "Si le travail continue après le terme d'un CDD sans nouveau contrat, il devient automatiquement un CDI à plein droit."),
      opt("Le CDD est prolongé d'un an", false, "Il n'y a pas de prolongation automatique d'un an : le contrat devient un CDI."),
    ],
  },
  {
    question: "Quelle est la durée maximale d'un CDD, renouvellements compris ?",
    options: [
      opt("6 mois", false, "Un CDD peut durer plus longtemps : jusqu'à 2 ans, renouvellements compris."),
      opt("2 ans", true, "Un CDD ne peut pas dépasser 2 ans, renouvellements compris."),
      opt("5 ans", false, "C'est trop : la limite est de 2 ans, renouvellements compris."),
    ],
  },
  {
    question: "Quel est le montant du SMIG au Congo, pour 40 heures par semaine ?",
    options: [
      opt("54 000 FCFA par mois", true, "Le SMIG est fixé par décret à 54 000 FCFA par mois. Aucun employeur formel ne peut payer moins."),
      opt("30 000 FCFA par mois", false, "C'est en dessous du minimum légal : le SMIG est de 54 000 FCFA par mois."),
      opt("Il n'existe pas de salaire minimum", false, "Si : le SMIG existe et s'élève à 54 000 FCFA par mois."),
    ],
  },
  {
    question: "Votre employeur vous retire 10 000 FCFA de salaire pour un retard, comme sanction. Est-ce permis ?",
    options: [
      opt("Oui, c'est son droit", false, "Non : les amendes ou sanctions financières décidées seul par l'employeur sont interdites."),
      opt("Non, les amendes sur salaire sont interdites", true, "Seuls sont permis les prélèvements fiscaux, les cotisations CNSS, les cessions volontaires et les saisies ordonnées par un tribunal."),
      opt("Oui, s'il vous prévient par écrit", false, "Même par écrit, une amende sur salaire reste interdite."),
    ],
  },
  {
    question: "Quelle est la durée légale du travail hors secteur agricole ?",
    options: [
      opt("35 heures par semaine", false, "Au Congo, la durée légale est de 40 heures par semaine."),
      opt("40 heures par semaine", true, "40 heures par semaine, soit 8 heures par jour sur 5 jours. Au-delà, ce sont des heures supplémentaires majorées."),
      opt("48 heures par semaine", false, "48 heures par semaine correspond environ au secteur agricole (2 400 heures par an)."),
    ],
  },
  {
    question: "Combien de jours de congés payés gagnez-vous par an ?",
    options: [
      opt("15 jours ouvrables", false, "C'est moins que la loi : on acquiert 2,1 jours par mois, soit 26 jours ouvrables par an."),
      opt("26 jours ouvrables", true, "2,1 jours par mois de travail effectif, soit 26 jours ouvrables par an, après 1 an de présence."),
      opt("30 jours calendaires", false, "Le calcul se fait en jours ouvrables : 26 par an."),
    ],
  },
  {
    question: "Une salariée est en congé maternité. Son employeur peut-il la licencier pendant cette période ?",
    options: [
      opt("Oui, avec un préavis", false, "Non : pendant le congé maternité, le licenciement est strictement interdit."),
      opt("Non, c'est strictement interdit", true, "Le congé maternité dure 15 semaines, et le licenciement est interdit pendant cette période."),
      opt("Oui, si l'entreprise va mal", false, "Même dans ce cas, le licenciement pendant le congé maternité est interdit."),
    ],
  },
  {
    question: "Vous êtes cadre en CDI et votre employeur met fin au contrat, sans faute lourde. Quel préavis vous doit-il ?",
    options: [
      opt("1 mois", false, "1 mois, c'est pour les ouvriers et employés. Un cadre a droit à 3 mois."),
      opt("3 mois", true, "Cadres : 3 mois de préavis écrit. Pendant le préavis, 1 jour d'absence payé par semaine pour chercher un emploi."),
      opt("Aucun préavis", false, "Sans faute lourde, un préavis écrit est obligatoire : 3 mois pour un cadre."),
    ],
  },
  {
    question: "Un conflit vous oppose à votre employeur. Quelle est la première étape prévue par la loi ?",
    options: [
      opt("Aller directement au tribunal du travail", false, "Le tribunal vient en dernier, après la conciliation et la médiation."),
      opt("Saisir l'Inspection du Travail pour une conciliation", true, "La conciliation à l'Inspection du Travail est gratuite. En cas d'échec : commission de médiation, puis tribunal du travail."),
      opt("Porter plainte à la police", false, "Un conflit de travail se règle d'abord par la conciliation à l'Inspection du Travail."),
    ],
  },
];

const LABOR_QUIZ: QuizQuestion[] = LABOR_QUESTIONS.map((q, i) => ({
  id: `droit-${String(i + 1).padStart(2, "0")}`,
  theme: "droit_du_travail",
  question: q.question,
  options: q.options,
  order: i + 1,
}));

export const INITIAL_QUIZ: QuizQuestion[] = [...INTERVIEW_QUIZ, ...LABOR_QUIZ];
