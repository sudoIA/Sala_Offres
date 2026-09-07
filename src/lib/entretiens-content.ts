// src/lib/entretiens-content.ts
// Contenu statique de la page Entretiens : guide des questions fréquentes et
// quiz d'entraînement (5 questions).

export interface InterviewQuestion {
  number: number;
  question: string;
  seeking: string;
  doText: string;
  dontText: string;
}

export const INTERVIEW_QUESTIONS: InterviewQuestion[] = [
  {
    number: 1,
    question: "« Parlez-moi de vous »",
    seeking: "Votre capacité de synthèse, votre parcours professionnel récent et votre adéquation avec le poste proposé.",
    doText:
      "Structurez en 3 temps (Passé, Présent, Futur) : «Diplômé en gestion à Brazzaville, j'ai exercé 2 ans en cabinet comptable. Aujourd'hui, je souhaite mettre mes compétences d'analyse au service de votre société pour optimiser vos processus.»",
    dontText: "Ne racontez pas votre vie personnelle (enfance, famille), et ne récitez pas mot pour mot votre CV de façon monotone.",
  },
  {
    number: 2,
    question: "« Pourquoi voulez-vous rejoindre notre entreprise ? »",
    seeking: "Avez-vous pris le temps de vous renseigner sur l'entreprise au Congo ? Êtes-vous motivé par ce projet ou cherchez-vous n'importe quel travail ?",
    doText:
      "Citez un fait précis : «J'admire l'engagement de votre entreprise dans la transition énergétique et votre récente expansion à Pointe-Noire. Mes compétences correspondent exactement aux défis de votre équipe.»",
    dontText: "«Je postule parce que j'ai besoin d'un travail et que le salaire est bon.» C'est un motif d'élimination immédiate.",
  },
  {
    number: 3,
    question: "« Quelles sont vos prétentions salariales ? »",
    seeking: "Votre connaissance du marché congolais et votre niveau d'exigence par rapport à vos compétences.",
    doText:
      "Donnez une fourchette réaliste en FCFA basée sur votre expérience : «Compte tenu des responsabilités et de mon profil, j'envisage une rémunération entre 250 000 et 350 000 FCFA net, mais je reste ouvert à la grille salariale de votre entreprise.»",
    dontText: "«Peu importe, donnez-moi ce que vous voulez.» Cela dénote un manque de confiance en soi.",
  },
  {
    number: 4,
    question: "« Avez-vous des questions pour nous ? »",
    seeking: "Votre curiosité, votre proactivité et votre vision du poste.",
    doText:
      "Posez 1 ou 2 questions pertinentes : «Quels sont les objectifs prioritaires pour ce poste durant les 3 premiers mois ?» ou «Comment s'organise l'équipe au quotidien ?»",
    dontText: "Répondre «Non, tout est clair» donne l'impression d'un candidat passif qui n'a pas réfléchi au poste.",
  },
];

export interface QuizOption {
  text: string;
  correct: boolean;
  explanation: string;
}

export interface QuizQuestion {
  question: string;
  options: QuizOption[];
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    question: "Quand le recruteur vous demande : « Parlez-moi de votre plus grand défaut », que répondez-vous ?",
    options: [
      { text: "Je dis que je suis trop perfectionniste ou trop travailleur.", correct: false, explanation: "C'est un cliché que les recruteurs entendent tous les jours et qui manque de sincérité." },
      { text: "Je cite un point d'amélioration réel et j'explique comment je travaille activement pour progresser.", correct: true, explanation: "Exact ! Exemple : « J'avais tendance à hésiter avant de prendre la parole en public, j'ai donc rejoint un club pour m'entraîner. »" },
      { text: "Je dis que je n'ai aucun défaut majeur dans le travail.", correct: false, explanation: "Cela donne une impression d'arrogance ou de manque de recul sur soi-même." },
    ],
  },
  {
    question: "À quelle heure devez-vous vous présenter le jour de votre entretien à Brazzaville ou Pointe-Noire ?",
    options: [
      { text: "Exactement à l'heure pile indiquée sur la convocation.", correct: false, explanation: "En cas d'imprévu ou de formalité à l'accueil, vous risquez d'arriver en retard." },
      { text: "10 à 15 minutes avant l'heure du rendez-vous.", correct: true, explanation: "Parfait ! Cela démontre ponctualité, respect et sang-froid." },
      { text: "1 heure à l'avance pour être le premier.", correct: false, explanation: "Arriver trop tôt peut mettre le recruteur mal à l'aise car il a d'autres obligations." },
    ],
  },
  {
    question: "Le recruteur vous demande vos prétentions salariales. Quelle est la meilleure approche ?",
    options: [
      { text: "Donner un chiffre net fixe sans négociation possible.", correct: false, explanation: "Cela ferme immédiatement la discussion." },
      { text: "Dire : « Payez-moi ce que vous voulez, je prends tout. »", correct: false, explanation: "Cela dévalorise vos compétences aux yeux du recruteur." },
      { text: "Proposer une fourchette réaliste basée sur le marché congolais tout en restant ouvert aux avantages de l'entreprise.", correct: true, explanation: "Bravo ! Cela montre que vous connaissez votre valeur tout en étant flexible." },
    ],
  },
  {
    question: "Que devez-vous apporter avec vous le jour de l'entretien ?",
    options: [
      { text: "Uniquement mon téléphone pour noter les remarques.", correct: false, explanation: "Sortir son téléphone en entretien est très mal perçu." },
      { text: "2 copies papier de mon CV, un carnet de notes avec stylo, et mes diplômes/attestations.", correct: true, explanation: "Excellente préparation professionnelle qui rassure le recruteur !" },
      { text: "Rien du tout, le recruteur a déjà tout imprimé.", correct: false, explanation: "Prendre ses copies montre que vous êtes prévoyant." },
    ],
  },
  {
    question: "En fin d'entretien, le recruteur vous demande si vous avez des questions. Que faites-vous ?",
    options: [
      { text: "Je pose une question sur les objectifs du poste ou l'équipe pour montrer ma motivation.", correct: true, explanation: "Très bien ! Cela prouve que vous vous projetez déjà dans le travail." },
      { text: "Je demande tout de suite quand est-ce que les congés payés commencent.", correct: false, explanation: "Aborder les congés avant même d'avoir été retenu donne une mauvaise impression." },
      { text: "Je dis « Non merci, j'ai tout compris » pour en finir vite.", correct: false, explanation: "C'est dommage, car poser une question renforce l'intérêt mutuel." },
    ],
  },
];
