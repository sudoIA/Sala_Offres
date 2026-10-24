// src/hooks/useCompanyDirectory.ts
// Fiches de l'annuaire des entreprises, chargées une seule fois par page
// (partagées entre tous les composants qui en ont besoin), pour relier une
// offre à la page de son entreprise (voir src/lib/company-match.ts).

"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { companyMatches } from "@/lib/company-match";
import { ANNUAIRE_COLLECTIONS, type AnnuaireItem, type AnnuaireItemDoc } from "@/types/annuaire";

let directory: Promise<AnnuaireItem[]> | null = null;

function loadDirectory(): Promise<AnnuaireItem[]> {
  if (!directory) {
    directory = getDocs(collection(db, ANNUAIRE_COLLECTIONS.companies))
      .then((snap) => snap.docs.map((d) => ({ id: d.id, ...(d.data() as AnnuaireItemDoc) })))
      .catch((err) => {
        console.warn("Annuaire des entreprises indisponible :", err);
        directory = null;
        return [];
      });
  }
  return directory;
}

/** Fiche de l'annuaire correspondant au nom d'entreprise d'une offre, ou null. */
export function findCompany(companies: AnnuaireItem[], name?: string | null): AnnuaireItem | null {
  if (!name) return null;
  return companies.find((c) => companyMatches(name, c.name) || companyMatches(name, c.full_name)) || null;
}

export function useCompanyFor(name?: string | null): AnnuaireItem | null {
  const [company, setCompany] = useState<AnnuaireItem | null>(null);
  useEffect(() => {
    let cancelled = false;
    if (!name) {
      setCompany(null);
      return;
    }
    loadDirectory().then((list) => {
      if (!cancelled) setCompany(findCompany(list, name));
    });
    return () => {
      cancelled = true;
    };
  }, [name]);
  return company;
}
