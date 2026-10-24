// src/hooks/useLegislationAdmin.ts
// Fiches Droit du Travail (collection "legislation"), triées par ordre
// d'affichage. Utilisé par le back-office ; la page publique /legislation
// a son propre hook avec repli sur le contenu intégré.

"use client";

import { useEffect, useState } from "react";
import { collection, doc, getDocs, onSnapshot, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { initialLegislationTopics } from "@/lib/legislation-content";
import { withMobileFields } from "@/lib/legislation-mobile";
import { TOPIC_LABELS, type LegislationDoc, type LegislationFiche, type LegislationTopic } from "@/types/legislation";

export function useLegislationAdmin() {
  const [fiches, setFiches] = useState<LegislationFiche[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "legislation"),
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as LegislationDoc) }));
        list.sort((a, b) => (a.order || 0) - (b.order || 0));
        setFiches(list);
        setLoading(false);
      },
      (err) => {
        console.error("Erreur chargement législation :", err);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, []);

  return { fiches, loading };
}

/** Classement des fiches venues de l'app (collection "droit_du_travail"). */
const APP_FICHE_META: Record<string, { topic: LegislationTopic; articleRef?: string; sourceUrl?: string; sourceLabel?: string }> = {
  FW9ajlMTxOrll2UAjIbd: { topic: "contrat", articleRef: "Art. 47-2 à 47-8", sourceLabel: "Code du travail (Loi n° 6-96)" },
  I9KuslGgo4PfRcV2QBQg: {
    topic: "conflits",
    sourceUrl: "https://www.linkedin.com/news/story/jai-alerté-mon-n1-sans-succès-4653993/",
    sourceLabel: "LinkedIn Actualités",
  },
};

/**
 * Copie dans "legislation" les fiches intégrées au site et celles de l'app
 * mobile ("droit_du_travail", laissée intacte). Identifiants fixes : une
 * fiche déjà présente n'est jamais écrasée, on peut relancer sans risque.
 * Renvoie le nombre de fiches ajoutées.
 */
export async function importLegislationFiches(existingIds: Set<string>): Promise<number> {
  const batch = writeBatch(db);
  let added = 0;

  for (const { id, ...fiche } of initialLegislationTopics) {
    if (existingIds.has(id)) continue;
    batch.set(doc(db, "legislation", id), withMobileFields(fiche));
    added++;
  }

  const appSnap = await getDocs(collection(db, "droit_du_travail"));
  appSnap.docs.forEach((d, i) => {
    const id = `app-${d.id}`;
    if (existingIds.has(id)) return;
    const data = d.data() as { title?: string; description?: string; readingTime?: string | number };
    const meta = APP_FICHE_META[d.id] || { topic: "contrat" as LegislationTopic };
    // Le lien "Source" d'origine a des guillemets typographiques (lien cassé) :
    // il est retiré du contenu et remplacé par le champ sourceUrl.
    const bodyHtml = (data.description || "").replace(/<a [^>]*>\s*Source\s*<\/a>\s*$/i, "").trim();
    batch.set(doc(db, "legislation", id), {
      topic: meta.topic,
      topicLabel: TOPIC_LABELS[meta.topic],
      articleRef: meta.articleRef || "",
      order: initialLegislationTopics.length + i + 1,
      title: data.title || "Fiche",
      intro: "",
      bodyHtml,
      faqQuestion: "",
      faqAnswer: "",
      ...(meta.sourceUrl ? { sourceUrl: meta.sourceUrl } : {}),
      ...(meta.sourceLabel ? { sourceLabel: meta.sourceLabel } : {}),
      // Champs lus par l'app : repris tels quels.
      description: data.description || "",
      readingTime: String(data.readingTime ?? "1"),
    });
    added++;
  });

  if (added > 0) await batch.commit();
  return added;
}
