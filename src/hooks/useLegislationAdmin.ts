// src/hooks/useLegislationAdmin.ts
// Fiches Droit du Travail (collection "legislation"), triées par ordre
// d'affichage. Utilisé par le back-office ; la page publique /legislation
// (Phase 4) aura son propre hook avec repli sur le contenu par défaut.

"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { LegislationDoc, LegislationFiche } from "@/types/legislation";

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
