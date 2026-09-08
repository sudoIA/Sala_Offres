// src/lib/entretiens-content.ts
// Contenu statique de la page Entretiens : guide des questions fréquentes et
// quiz d'entraînement (10 questions).

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
  {
    number: 5,
    question: "« Pourquoi avez-vous quitté (ou souhaitez-vous quitter) votre poste actuel ? »",
    seeking: "Votre capacité à rester positif face à une expérience passée et votre maturité professionnelle.",
    doText:
      "Restez factuel et tourné vers l'avenir : «Après 2 ans très formateurs, je recherche aujourd'hui un poste avec plus de responsabilités, ce que votre offre me permet d'envisager.»",
    dontText: "Ne critiquez jamais votre ancien employeur ou vos anciens collègues, même si la relation s'est mal terminée.",
  },
  {
    number: 6,
    question: "« Où vous voyez-vous dans 5 ans ? »",
    seeking: "Votre ambition, votre stabilité et si vos projets sont compatibles avec l'entreprise.",
    doText:
      "Montrez une progression réaliste et liée au poste : «Je me vois avoir approfondi mon expertise et évolué vers plus de responsabilités au sein d'une entreprise comme la vôtre.»",
    dontText: "Évitez «Je ne sais pas» (manque de projection) ou une réponse totalement déconnectée du poste visé.",
  },
  {
    number: 7,
    question: "« Décrivez une situation difficile que vous avez surmontée »",
    seeking: "Votre capacité à gérer la pression, à trouver des solutions et à en tirer des leçons.",
    doText:
      "Utilisez la méthode Situation - Action - Résultat : décrivez brièvement le contexte, ce que vous avez fait concrètement, puis le résultat obtenu.",
    dontText: "Ne dites pas «Je n'ai jamais rencontré de difficulté» — cela paraît peu crédible et n'apporte aucune information utile au recruteur.",
  },
  {
    number: 8,
    question: "« Quelles sont vos disponibilités pour commencer ? »",
    seeking: "Votre sérieux et la compatibilité de votre calendrier avec les besoins réels de l'entreprise.",
    doText:
      "Soyez précis et honnête : «Je suis disponible immédiatement» ou «Je dois respecter un préavis d'un mois, mais je reste flexible si besoin.»",
    dontText: "Évitez les réponses vagues comme «Je verrai» qui donnent l'impression que le poste n'est pas une priorité pour vous.",
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
  {
    question: "Le recruteur vous demande pourquoi vous avez quitté votre précédent emploi. Quelle réponse privilégier ?",
    options: [
      { text: "Expliquer calmement que je recherche plus de responsabilités, sans critiquer mon ancien employeur.", correct: true, explanation: "Exact ! Une réponse positive et tournée vers l'avenir rassure toujours le recruteur." },
      { text: "Dire que mon ancien patron était incompétent et invivable.", correct: false, explanation: "Critiquer un ancien employeur inquiète le recruteur sur votre propre comportement futur." },
      { text: "Rester vague et changer de sujet rapidement.", correct: false, explanation: "Cela peut donner l'impression que vous cachez quelque chose." },
    ],
  },
  {
    question: "Vous ne connaissez pas la réponse à une question technique posée en entretien. Que faites-vous ?",
    options: [
      { text: "J'invente une réponse pour ne pas paraître incompétent.", correct: false, explanation: "Un recruteur expérimenté détecte vite une réponse inventée, ce qui nuit à votre crédibilité." },
      { text: "Je reconnais ne pas savoir, mais j'explique comment je trouverais la réponse.", correct: true, explanation: "Parfait ! L'honnêteté et la capacité à apprendre sont très valorisées." },
      { text: "Je reste silencieux en espérant que la question passe.", correct: false, explanation: "Le silence prolongé met mal à l'aise et ne rassure pas sur votre réactivité." },
    ],
  },
  {
    question: "Comment devez-vous vous habiller pour un entretien d'embauche au Congo ?",
    options: [
      { text: "Une tenue décontractée, comme pour sortir entre amis.", correct: false, explanation: "Même pour un poste peu formel, une tenue trop décontractée manque de sérieux." },
      { text: "Une tenue soignée et sobre, adaptée au secteur d'activité de l'entreprise.", correct: true, explanation: "Exact ! Une présentation soignée reflète votre respect pour l'entretien et l'entreprise." },
      { text: "Peu importe la tenue, seules les compétences comptent.", correct: false, explanation: "La première impression visuelle influence fortement le jugement du recruteur." },
    ],
  },
  {
    question: "Le jour de l'entretien, vous êtes bloqué(e) dans les embouteillages et allez être en retard. Que faites-vous ?",
    options: [
      { text: "J'arrive en retard sans prévenir et je m'excuse une fois sur place.", correct: false, explanation: "Ne pas prévenir donne l'impression d'un manque de respect pour le temps du recruteur." },
      { text: "J'appelle ou j'envoie un message dès que possible pour prévenir du retard et de l'heure estimée d'arrivée.", correct: true, explanation: "Très bien ! Prévenir rapidement montre du professionnalisme, même en cas d'imprévu." },
      { text: "J'annule l'entretien sans explication.", correct: false, explanation: "Cela ferme définitivement la porte à cette opportunité, alors qu'un simple message suffisait." },
    ],
  },
];
