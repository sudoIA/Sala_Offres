// src/app/sitemap.ts
// Génère /sitemap.xml : les pages statiques du site + une entrée par offre
// active, pour que les moteurs de recherche découvrent chaque offre.

import type { MetadataRoute } from "next";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getSiteUrl } from "@/lib/site-url";

// Regénéré au plus toutes les heures : évite d'interroger Firestore à
// chaque passage d'un robot tout en gardant la liste des offres à jour.
export const revalidate = 3600;

const STATIC_PATHS = [
  "",
  "/offres",
  "/evenements",
  "/annuaires",
  "/legislation",
  "/entretiens",
  "/cv-builder",
  "/privacy-policy",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
  }));

  let jobEntries: MetadataRoute.Sitemap = [];
  try {
    const snap = await getDocs(collection(db, "emplois"));
    jobEntries = snap.docs
      .filter((d) => d.data().visibility !== false)
      .map((d) => ({ url: `${base}/offres/${d.id}`, lastModified: now }));
  } catch (err) {
    console.error("Erreur génération du sitemap (offres) :", err);
  }

  return [...staticEntries, ...jobEntries];
}
