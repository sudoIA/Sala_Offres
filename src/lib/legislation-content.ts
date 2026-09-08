// src/lib/legislation-content.ts
// Guide Droit du Travail intégré (8 fiches thématiques), utilisé en repli si
// la collection Firestore "legislation" est vide/inaccessible. Éditable
// depuis l'administration une fois des fiches publiées.

import type { LegislationFiche } from "@/types/legislation";

export const initialLegislationTopics: LegislationFiche[] = [
  {
    id: "leg-contrat",
    topic: "contrat",
    topicLabel: "Contrat de Travail",
    articleRef: "Art. 10 à 35",
    title: "CDI, CDD & Période d'Essai",
    intro: "En République du Congo, le travailleur et l'employeur sont liés par une convention formelle ou verbale.",
    bodyHtml: `
      <div class="law-highlight">
        <strong><i class="fas fa-check-circle text-success me-1"></i> Périodes d'essai maximales :</strong>
        <ul class="mb-0 mt-2 ps-3 small text-muted">
          <li><strong>Ouvriers & Employés :</strong> 1 mois maximum.</li>
          <li><strong>Agents de maîtrise :</strong> 2 mois maximum.</li>
          <li><strong>Cadres supérieurs :</strong> 3 mois maximum.</li>
          <li><em>Renouvellement :</em> Possible 1 seule fois, expressément par écrit.</li>
        </ul>
      </div>
      <div class="law-warning">
        <strong><i class="fas fa-exclamation-triangle text-danger me-1"></i> Requalification du CDD :</strong>
        <p class="mb-0 mt-1 small text-muted">
          Un contrat à durée déterminée (CDD) ne peut excéder 2 ans (renouvellements compris). Si l'employé continue après le terme sans nouveau contrat, il devient automatiquement un <strong>CDI à plein droit</strong>.
        </p>
      </div>
    `,
    sourceUrl: "https://www.sgg.cg/codes/congo-code-1975-travail.pdf",
    sourceLabel: "Code du travail — Secrétariat Général du Gouvernement (sgg.cg)",
    faqQuestion: "Existe-t-il un contrat d'apprentissage ou de stage ?",
    faqAnswer:
      "Oui. Le contrat d'apprentissage doit obligatoirement être rédigé par écrit et enregistré auprès de l'ACPE (Agence Congolaise Pour l'Emploi). L'employeur s'engage à assurer une formation méthodique et complète au stagiaire.",
    order: 1,
  },
  {
    id: "leg-salaire",
    topic: "salaire",
    topicLabel: "Rémunération",
    articleRef: "Art. 85 à 110",
    title: "Salaire, SMIG & Bulletin de Paie",
    intro: "À travail égal, le salaire est égal pour tous les travailleurs, quels que soient leur sexe, leur origine ou leur statut.",
    bodyHtml: `
      <div class="law-highlight">
        <strong><i class="fas fa-coins text-warning me-1"></i> Le SMIG au Congo :</strong>
        <p class="mb-0 mt-1 small text-muted">
          Le Salaire Minimum Interprofessionnel Garanti (SMIG) est fixé par décret présidentiel à <strong>54 000 FCFA / mois</strong> pour 40 heures hebdomadaires. Aucun employeur formel ne peut légalement payer en dessous de ce seuil.
        </p>
      </div>
      <div class="law-highlight">
        <strong><i class="fas fa-receipt text-primary me-1"></i> Obligation du Bulletin de Paie :</strong>
        <p class="mb-0 mt-1 small text-muted">
          L'employeur a l'obligation légale de délivrer un bulletin de paie détaillé mentionnant : le salaire de base, les primes, les retenues CNSS et l'impôt sur le revenu (IRPP), ainsi que la date de paiement.
        </p>
      </div>
    `,
    sourceUrl: "https://www.sgg.cg/codes/congo-code-1975-travail.pdf",
    sourceLabel: "Code du travail — Secrétariat Général du Gouvernement (sgg.cg)",
    faqQuestion: "Peut-on me faire des retenues sur salaire ?",
    faqAnswer:
      "Les retenues sont strictement encadrées par la loi : prélèvements fiscaux obligatoires, cotisations CNSS et cessions volontaires ou saisies ordonnées par un tribunal. Les amendes ou sanctions financières directes infligées unilatéralement par l'employeur sont interdites.",
    order: 2,
  },
  {
    id: "leg-horaires",
    topic: "horaires",
    topicLabel: "Temps de Travail",
    articleRef: "Art. 111 à 120",
    title: "40 Heures & Heures Supplémentaires",
    intro: "La durée légale du travail est fixée pour protéger la santé et la sécurité de chaque travailleur congolais.",
    bodyHtml: `
      <div class="law-highlight">
        <strong><i class="fas fa-business-time text-success me-1"></i> Durée légale de référence :</strong>
        <ul class="mb-0 mt-2 ps-3 small text-muted">
          <li><strong>Secteur non agricole :</strong> 40 heures par semaine (ou 8 heures par jour sur 5 jours).</li>
          <li><strong>Secteur agricole :</strong> 2 400 heures par an (environ 48h/semaine).</li>
          <li><strong>Repos hebdomadaire :</strong> Obligatoire, au moins 24 heures consécutives (généralement le dimanche).</li>
        </ul>
      </div>
      <div class="law-highlight">
        <strong><i class="fas fa-chart-line text-info me-1"></i> Majoration des heures supplémentaires :</strong>
        <ul class="mb-0 mt-2 ps-3 small text-muted">
          <li>Heures de jour en semaine : <strong>+10% à +25%</strong> de majoration.</li>
          <li>Heures de nuit (20h - 5h) : <strong>+50%</strong> de majoration.</li>
          <li>Dimanches et jours fériés : <strong>+50% à +100%</strong> de majoration.</li>
        </ul>
      </div>
    `,
    sourceUrl: "https://www.sgg.cg/codes/congo-code-1975-travail.pdf",
    sourceLabel: "Code du travail — Secrétariat Général du Gouvernement (sgg.cg)",
    faqQuestion: "",
    faqAnswer: "",
    order: 3,
  },
  {
    id: "leg-conges",
    topic: "conges",
    topicLabel: "Congés & Repos",
    articleRef: "Art. 125 à 135",
    title: "Congés Payés & Maternité",
    intro: "Tout travailleur a droit à un repos rémunéré après une période de travail effectif continu.",
    bodyHtml: `
      <div class="law-highlight">
        <strong><i class="fas fa-calendar-check text-success me-1"></i> Calcul des congés payés :</strong>
        <p class="mb-0 mt-1 small text-muted">
          Le travailleur acquiert <strong>2,1 jours ouvrables</strong> de congé par mois effectif, soit <strong>26 jours ouvrables par an</strong>. Ce droit s'ouvre après 1 an de présence continue dans l'entreprise.
        </p>
      </div>
      <div class="law-highlight" style="border-left-color: #d946ef; background: #fdf4ff;">
        <strong style="color: #a21caf;"><i class="fas fa-baby me-1"></i> Protection de la Maternité (Femmes) :</strong>
        <ul class="mb-0 mt-2 ps-3 small text-muted">
          <li><strong>Congé maternité :</strong> 15 semaines consécutives (dont 6 semaines après l'accouchement).</li>
          <li>Pendant cette période, le licenciement est <strong>strictement interdit</strong>.</li>
          <li>Droit à des pauses journalières rémunérées pour l'allaitement (1h par jour pendant 15 mois).</li>
        </ul>
      </div>
    `,
    sourceUrl: "https://www.sgg.cg/codes/congo-code-1975-travail.pdf",
    sourceLabel: "Code du travail — Secrétariat Général du Gouvernement (sgg.cg)",
    faqQuestion: "",
    faqAnswer: "",
    order: 4,
  },
  {
    id: "leg-rupture",
    topic: "rupture",
    topicLabel: "Fin de Contrat",
    articleRef: "Art. 36 à 65",
    title: "Licenciement, Démission & Préavis",
    intro: "La fin d'un CDI obéit à des règles strictes pour éviter les ruptures abusives et protéger le salarié.",
    bodyHtml: `
      <div class="law-warning">
        <strong><i class="fas fa-file-signature text-danger me-1"></i> Préavis obligatoire :</strong>
        <p class="mb-0 mt-1 small text-muted">La rupture d'un CDI sans faute lourde exige un <strong>préavis écrit notifié</strong> :</p>
        <ul class="mb-0 mt-2 ps-3 small text-muted">
          <li>Ouvriers & Employés : 1 mois de préavis.</li>
          <li>Agents de maîtrise : 2 mois de préavis.</li>
          <li>Cadres : 3 mois de préavis.</li>
          <li>Pendant le préavis, l'employé a droit à <strong>1 jour d'absence par semaine</strong> payé pour chercher un nouvel emploi.</li>
        </ul>
      </div>
      <div class="law-highlight">
        <strong><i class="fas fa-certificate text-success me-1"></i> Documents obligatoires remis à la sortie :</strong>
        <ul class="mb-0 mt-2 ps-3 small text-muted">
          <li><strong>Certificat de travail :</strong> Attestant des dates et fonctions exercées (sans mention défavorable).</li>
          <li><strong>Reçu pour solde de tout compte :</strong> Détaillant le salaire restant et les congés non pris.</li>
        </ul>
      </div>
    `,
    sourceUrl: "https://www.sgg.cg/codes/congo-code-1975-travail.pdf",
    sourceLabel: "Code du travail — Secrétariat Général du Gouvernement (sgg.cg)",
    faqQuestion: "",
    faqAnswer: "",
    order: 5,
  },
  {
    id: "leg-hygiene",
    topic: "hygiene",
    topicLabel: "Hygiène & Sécurité",
    articleRef: "Art. 136 à 158",
    title: "Hygiène, Sécurité & Médecine du Travail",
    intro: "Chaque entreprise doit garantir un environnement de travail sain et prévenir les risques professionnels.",
    bodyHtml: `
      <div class="law-highlight">
        <strong><i class="fas fa-user-md text-success me-1"></i> Service de médecine du travail :</strong>
        <p class="mb-0 mt-1 small text-muted">
          Toute entreprise a l'obligation d'assurer un service de santé au travail (propre ou interentreprises), reconnu par la CNSS. Son rôle est préventif : surveillance médicale des travailleurs, suivi de l'état des lieux de travail et premiers secours en cas d'accident.
        </p>
      </div>
      <div class="law-highlight">
        <strong><i class="fas fa-hard-hat text-warning me-1"></i> Obligations de l'employeur :</strong>
        <ul class="mb-0 mt-2 ps-3 small text-muted">
          <li>Organiser un service dédié à l'hygiène, la sécurité et l'amélioration des conditions de travail.</li>
          <li>Maintenir les locaux en état constant de propreté et de sécurité.</li>
          <li>Prendre toutes les mesures utiles pour prévenir les risques professionnels (équipements de protection, formation...).</li>
        </ul>
      </div>
    `,
    sourceUrl: "https://www.sgg.cg/codes/congo-code-1975-travail.pdf",
    sourceLabel: "Code du travail — Secrétariat Général du Gouvernement (sgg.cg)",
    faqQuestion: "Qui prend en charge un accident survenu sur le lieu de travail ?",
    faqAnswer:
      "Les accidents du travail et maladies professionnelles sont couverts par la CNSS (Caisse Nationale de Sécurité Sociale). L'employeur doit déclarer tout accident dans les délais légaux pour que le travailleur soit indemnisé.",
    order: 6,
  },
  {
    id: "leg-representation",
    topic: "representation",
    topicLabel: "Représentation & Syndicats",
    articleRef: "Art. 180 à 210",
    title: "Délégués du Personnel & Liberté Syndicale",
    intro: "Les travailleurs congolais ont le droit de se syndiquer librement et d'élire des représentants au sein de l'entreprise.",
    bodyHtml: `
      <div class="law-highlight">
        <strong><i class="fas fa-users text-success me-1"></i> Délégués du personnel :</strong>
        <p class="mb-0 mt-1 small text-muted">
          Élus par les travailleurs, les délégués du personnel bénéficient d'un mandat de <strong>2 ans</strong>. Ils portent les réclamations individuelles et collectives auprès de l'employeur et bénéficient d'une protection renforcée contre le licenciement.
        </p>
      </div>
      <div class="law-highlight">
        <strong><i class="fas fa-flag text-primary me-1"></i> Liberté syndicale :</strong>
        <p class="mb-0 mt-1 small text-muted">
          Tout travailleur peut librement adhérer au syndicat de son choix, sans crainte de représailles. Les organisations syndicales peuvent négocier avec l'employeur les conditions de travail applicables dans leur secteur.
        </p>
      </div>
    `,
    sourceUrl: "https://www.sgg.cg/codes/congo-code-1975-travail.pdf",
    sourceLabel: "Code du travail — Secrétariat Général du Gouvernement (sgg.cg)",
    faqQuestion: "Un employeur peut-il licencier un délégué du personnel librement ?",
    faqAnswer:
      "Non. Les délégués du personnel et délégués syndicaux bénéficient d'une protection spécifique : leur licenciement obéit à une procédure renforcée, précisément pour éviter les représailles liées à leur mandat de représentation.",
    order: 7,
  },
  {
    id: "leg-conflits",
    topic: "conflits",
    topicLabel: "Règlement des Conflits",
    articleRef: "Art. 240 et suivants",
    title: "Conciliation, Médiation & Tribunal du Travail",
    intro: "En cas de désaccord avec votre employeur, la loi prévoit un parcours précis avant tout recours judiciaire.",
    bodyHtml: `
      <div class="law-highlight">
        <strong><i class="fas fa-handshake text-success me-1"></i> 1. Conciliation à l'Inspection du Travail :</strong>
        <p class="mb-0 mt-1 small text-muted">
          Le travailleur ou l'employeur saisit gratuitement l'Inspection du Travail. L'inspecteur convoque les deux parties et dresse un procès-verbal de conciliation ou de non-conciliation.
        </p>
      </div>
      <div class="law-highlight">
        <strong><i class="fas fa-people-arrows text-info me-1"></i> 2. Commission de médiation :</strong>
        <p class="mb-0 mt-1 small text-muted">
          En cas d'échec, le litige est soumis à une commission de médiation (président du tribunal de paix, un assesseur employeur, un assesseur travailleur), qui se réunit dans les 3 jours suivant la saisine.
        </p>
      </div>
      <div class="law-warning">
        <strong><i class="fas fa-balance-scale text-danger me-1"></i> 3. Tribunal du Travail :</strong>
        <p class="mb-0 mt-1 small text-muted">
          Si la médiation échoue également, le litige est porté devant le tribunal du travail compétent, qui tranche en dernier ressort.
        </p>
      </div>
    `,
    sourceUrl: "https://fonction-publique.gouv.cg/fr/mission-de-conciliation",
    sourceLabel: "Mission de conciliation — Ministère de la Fonction Publique, du Travail et de la Sécurité Sociale",
    faqQuestion: "Le délai pour agir en justice est-il suspendu pendant la conciliation ?",
    faqAnswer:
      "Oui. La prescription (délai légal pour agir, article 99) est suspendue jusqu'à la clôture du procès-verbal de conciliation, afin de ne pas pénaliser un travailleur qui tente d'abord un règlement amiable.",
    order: 8,
  },
];
