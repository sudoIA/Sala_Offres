// src/app/sitemap.ts
// Génère /sitemap.xml : les pages statiques du site + une entrée par offre
// active, pour que les moteurs de recherche découvrent chaque offre.

import type { MetadataRoute } from "next";
import { collection, getDocs, query, Timestamp, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getAdminDb, hasAdminCredentials } from "@/lib/firebase-admin";
import { getSiteUrl } from "@/lib/site-url";

// Regénéré au plus toutes les heures : évite d'interroger Firestore à
// chaque passage d'un robot tout en gardant la liste des offres à jour.
export const revalidate = 3600;

const STATIC_PATHS = [
  "",
  "/offres",
  "/evenements",
  "/actualites",
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
    // Offres encore ouvertes uniquement : inutile de signaler aux moteurs de
    // recherche des milliers d'offres expirées.
    // SDK Admin en production (non soumis à App Check), SDK client en local.
    const docs = hasAdminCredentials()
      ? (await getAdminDb().collection("emplois").where("deadline", ">", now).get()).docs
      : (await getDocs(query(collection(db, "emplois"), where("deadline", ">", Timestamp.now())))).docs;
    jobEntries = docs
      .filter((d) => d.data().visibility !== false)
      .map((d) => ({ url: `${base}/offres/${d.id}`, lastModified: now }));
  } catch (err) {
    console.error("Erreur génération du sitemap (offres) :", err);
  }

  return [...staticEntries, ...jobEntries];
}
