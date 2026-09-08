// src/lib/jobs-server.ts
// Lecture d'une offre côté serveur, uniquement pour générer les métadonnées
// (titre, description, aperçu de partage) de la page de détail. L'affichage
// du contenu reste géré côté client comme partout ailleurs sur le site
// (voir JobDetailPageClient) : ce module ne fait qu'une lecture légère et
// isolée pour le <head> de la page.

import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { JobDoc } from "@/types/job";

export interface JobMetadata {
  title: string;
  company: string;
  city: string;
  description: string;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export async function getJobMetadata(jobId: string): Promise<JobMetadata | null> {
  try {
    const snap = await getDoc(doc(db, "emplois", jobId));
    if (!snap.exists()) return null;

    const data = snap.data() as JobDoc;
    if (data.visibility === false) return null;

    const plainBody = stripHtml(data.body || "");
    const description =
      plainBody.length > 155 ? `${plainBody.slice(0, 155).trimEnd()}…` : plainBody;

    return {
      title: data.title || "Offre d'emploi",
      company: data.company || "Entreprise au Congo",
      city: data.city || "Congo",
      description:
        description ||
        "Découvrez cette offre d'emploi sur Sala, la plateforme d'aide à l'emploi pour les jeunes en République du Congo.",
    };
  } catch (err) {
    console.error("Erreur récupération métadonnées de l'offre :", err);
    return null;
  }
}
