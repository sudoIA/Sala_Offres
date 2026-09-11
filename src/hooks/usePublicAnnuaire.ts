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
  const [universities, setUniversities] = useState<AnnuaireItem[]>([]);
  const [companies, setCompanies] = useState<AnnuaireItem[]>([]);
  const [clubs, setClubs] = useState<AnnuaireItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    // Lu ici (dans l'effet), jamais pendant le rendu : le rendu serveur n'a
    // pas accès à localStorage, donc lire le cache pendant le rendu produit
    // un contenu différent entre serveur et client (erreur d'hydratation).
    const cached = loadSnapshot<AnnuairesData>(CACHE_KEY);
    if (cached) {
      setUniversities(cached.data.universities);
      setCompanies(cached.data.companies);
      setClubs(cached.data.clubs);
      setLoading(false);
    }

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
  }, []);

  return { universities, companies, clubs, loading };
}
