// src/hooks/usePublicAnnuaire.ts
// Charge les 3 annuaires publics depuis Firestore, avec repli résilient sur
// la dernière copie locale (mode hors-ligne) puis sur les fiches intégrées
// si rien n'est disponible.

"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { initialCompanies, initialEnglishClubs, initialUniversities } from "@/lib/annuaires-content";
import { loadSnapshot, saveSnapshot } from "@/lib/offline-cache";
import { ANNUAIRE_COLLECTIONS, type AnnuaireItem, type AnnuaireItemDoc } from "@/types/annuaire";

const CACHE_KEY = "annuaires";
const FETCH_TIMEOUT_MS = 8000;

interface AnnuairesData {
  universities: AnnuaireItem[];
  companies: AnnuaireItem[];
  clubs: AnnuaireItem[];
}

function timeout(ms: number): Promise<never> {
  return new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), ms));
}

async function loadOrFallback(colName: string, fallback: AnnuaireItem[]): Promise<AnnuaireItem[]> {
  try {
    const snap = await Promise.race([getDocs(collection(db, colName)), timeout(FETCH_TIMEOUT_MS)]);
    if (!snap.empty) return snap.docs.map((d) => ({ id: d.id, ...(d.data() as AnnuaireItemDoc) }));
  } catch (e) {
    console.warn(`Firestore ${colName} indisponible, utilisation du repli.`, e);
  }
  return fallback;
}

export function usePublicAnnuaires() {
  const cached = typeof window !== "undefined" ? loadSnapshot<AnnuairesData>(CACHE_KEY) : null;
  const [universities, setUniversities] = useState<AnnuaireItem[]>(cached?.data.universities || []);
  const [companies, setCompanies] = useState<AnnuaireItem[]>(cached?.data.companies || []);
  const [clubs, setClubs] = useState<AnnuaireItem[]>(cached?.data.clubs || []);
  const [loading, setLoading] = useState(!cached);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      loadOrFallback(ANNUAIRE_COLLECTIONS.universities, cached?.data.universities || initialUniversities),
      loadOrFallback(ANNUAIRE_COLLECTIONS.companies, cached?.data.companies || initialCompanies),
      loadOrFallback(ANNUAIRE_COLLECTIONS.clubs, cached?.data.clubs || initialEnglishClubs),
    ]).then(([uni, comp, club]) => {
      if (cancelled) return;
      setUniversities(uni);
      setCompanies(comp);
      setClubs(club);
      setLoading(false);
      saveSnapshot<AnnuairesData>(CACHE_KEY, { universities: uni, companies: comp, clubs: club });
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { universities, companies, clubs, loading };
}
