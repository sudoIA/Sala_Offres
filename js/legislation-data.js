// js/legislation-data.js
// Données et chargeur du guide Droit du Travail (collection Firestore "legislation").
// Les 5 fiches thématiques ci-dessous sont éditables depuis l'administration ;
// la fiche "Organismes" (ACPE/CNSS/Inspection du Travail) reste fixe dans legislation.html
// car sa mise en page (encarts institutionnels colorés) est trop différente pour être généralisée.

import { db, collection, getDocs, query, orderBy } from "./firebase-config.js";

export const initialLegislationTopics = [
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
    faqQuestion: "Existe-t-il un contrat d'apprentissage ou de stage ?",
    faqAnswer: "Oui. Le contrat d'apprentissage doit obligatoirement être rédigé par écrit et enregistré auprès de l'ACPE (Agence Congolaise Pour l'Emploi). L'employeur s'engage à assurer une formation méthodique et complète au stagiaire.",
    order: 1
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
    faqQuestion: "Peut-on me faire des retenues sur salaire ?",
    faqAnswer: "Les retenues sont strictement encadrées par la loi : prélèvements fiscaux obligatoires, cotisations CNSS et cessions volontaires ou saisies ordonnées par un tribunal. Les amendes ou sanctions financières directes infligées unilatéralement par l'employeur sont interdites.",
    order: 2
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
    faqQuestion: "",
    faqAnswer: "",
    order: 3
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
    faqQuestion: "",
    faqAnswer: "",
    order: 4
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
    faqQuestion: "",
    faqAnswer: "",
    order: 5
  }
];

/**
 * Charge les fiches Droit du Travail depuis Firestore ou utilise les fiches par défaut.
 */
export async function loadLegislationTopics() {
  try {
    const q = query(collection(db, "legislation"), orderBy("order", "asc"));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    }
  } catch (e) {
    console.warn("Firestore 'legislation' vide ou inaccessible, utilisation du contenu intégré.", e);
  }
  return initialLegislationTopics;
}
