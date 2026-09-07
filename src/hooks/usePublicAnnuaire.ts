// src/hooks/usePublicAnnuaire.ts
// Charge les 3 annuaires publics depuis Firestore, avec repli sur les
// fiches intégrées si une collection est vide ou inaccessible.

"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { initialCompanies, initialEnglishClubs, initialUniversities } from "@/lib/annuaires-content";
import { ANNUAIRE_COLLECTIONS, type AnnuaireItem, type AnnuaireItemDoc } from "@/types/annuaire";

async function loadOrFallback(colName: string, fallback: AnnuaireItem[]): Promise<AnnuaireItem[]> {
  try {
    const snap = await getDocs(collection(db, colName));
    if (!snap.empty) return snap.docs.map((d) => ({ id: d.id, ...(d.data() as AnnuaireItemDoc) }));
  } catch (e) {
    console.warn(`Firestore ${colName} vide, utilisation des données intégrées.`, e);
  }
  return fallback;
}

export function usePublicAnnuaires() {
  const [universities, setUniversities] = useState<AnnuaireItem[]>([]);
  const [companies, setCompanies] = useState<AnnuaireItem[]>([]);
  const [clubs, setClubs] = useState<AnnuaireItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      loadOrFallback(ANNUAIRE_COLLECTIONS.universities, initialUniversities),
      loadOrFallback(ANNUAIRE_COLLECTIONS.companies, initialCompanies),
      loadOrFallback(ANNUAIRE_COLLECTIONS.clubs, initialEnglishClubs),
    ]).then(([uni, comp, club]) => {
      if (cancelled) return;
      setUniversities(uni);
      setCompanies(comp);
      setClubs(club);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return { universities, companies, clubs, loading };
}
