// src/app/entreprises/[id]/page.tsx
// Page d'une entreprise de l'annuaire : sa fiche et ses offres en cours.
// Composant serveur pour le titre et l'aperçu de partage ; l'affichage est
// délégué à CompanyPageClient.

import type { Metadata } from "next";
import { readDocument } from "@/lib/api/server-data";
import { annuaireCardSummary, annuaireFullName } from "@/lib/annuaire-helpers";
import { ANNUAIRE_COLLECTIONS, type AnnuaireItem } from "@/types/annuaire";
import { CompanyPageClient } from "./CompanyPageClient";

type Params = Promise<{ id: string }>;

const VALID_ID = /^[\w-]{1,128}$/;

async function loadCompany(id: string): Promise<AnnuaireItem | null> {
  if (!VALID_ID.test(id)) return null;
  try {
    return (await readDocument(ANNUAIRE_COLLECTIONS.companies, id)) as AnnuaireItem | null;
  } catch (err) {
    console.error("Lecture de l'entreprise impossible :", err);
    return null;
  }
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const company = await loadCompany(id);
  if (!company) return { title: "Entreprise introuvable - Sala" };
  const title = `${annuaireFullName(company)} : fiche et offres d'emploi | Sala`;
  const description = annuaireCardSummary(company) || `Coordonnées et offres d'emploi en cours de ${annuaireFullName(company)} au Congo.`;
  return { title, description, openGraph: { title, description, type: "website" } };
}

export default async function CompanyPage({ params }: { params: Params }) {
  const { id } = await params;
  return <CompanyPageClient id={id} />;
}
