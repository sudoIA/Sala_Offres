// src/hooks/useAnnuaire.ts
// Fiches d'une des 3 catégories d'annuaires ("universites", "entreprises",
// "clubs_anglais"), rebranchées en temps réel quand la catégorie change.

"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ANNUAIRE_COLLECTIONS, type AnnuaireCategory, type AnnuaireItem, type AnnuaireItemDoc } from "@/types/annuaire";

export function useAnnuaire(category: AnnuaireCategory) {
  const [items, setItems] = useState<AnnuaireItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const colName = ANNUAIRE_COLLECTIONS[category];
    const unsubscribe = onSnapshot(
      collection(db, colName),
      (snapshot) => {
        setItems(snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as AnnuaireItemDoc) })));
        setLoading(false);
      },
      (err) => {
        console.error(`Erreur chargement ${colName} :`, err);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, [category]);

  return { items, loading };
}
