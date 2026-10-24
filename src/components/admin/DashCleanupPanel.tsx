// src/components/admin/DashCleanupPanel.tsx
// Admin > Paramètres : remplace une fois pour toutes les tirets longs (— –)
// par des tirets courts dans le contenu déjà en base. Les nouveaux contenus
// sont corrigés à l'enregistrement (voir lib/dashes.ts).

"use client";

import { useState } from "react";
import { collection, getDocs, writeBatch, type DocumentReference } from "firebase/firestore";
import Swal from "sweetalert2";
import { db } from "@/lib/firebase";
import { dashFieldUpdates } from "@/lib/dashes";
import { notify } from "@/lib/notify";
import { logAdminAction } from "@/lib/admin-log";

const COLLECTIONS: { name: string; label: string }[] = [
  { name: "emplois", label: "Offres d'emploi" },
  { name: "events", label: "Événements" },
  { name: "legislation", label: "Droit du travail" },
  { name: "quiz", label: "Quiz" },
  { name: "news", label: "News Sala" },
  { name: "universites", label: "Universités" },
  { name: "entreprises", label: "Entreprises" },
  { name: "clubs_anglais", label: "Clubs d'anglais" },
];

interface PendingUpdate {
  ref: DocumentReference;
  updates: Record<string, unknown>;
}

export function DashCleanupPanel() {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function run() {
    setRunning(true);
    setResult(null);
    try {
      // 1. Recherche
      const pending: PendingUpdate[] = [];
      const counts: string[] = [];
      for (const { name, label } of COLLECTIONS) {
        const snap = await getDocs(collection(db, name));
        let n = 0;
        snap.docs.forEach((d) => {
          const updates = dashFieldUpdates(d.data());
          if (updates) {
            pending.push({ ref: d.ref, updates });
            n++;
          }
        });
        if (n) counts.push(`${label} : ${n}`);
      }

      if (pending.length === 0) {
        setResult("Aucun tiret long trouvé : tout est déjà propre.");
        return;
      }

      // 2. Confirmation
      const confirm = await Swal.fire({
        title: `${pending.length} élément(s) à corriger`,
        html: `${counts.join("<br>")}<br><br>Les tirets longs seront remplacés par « - ». Continuer ?`,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Remplacer",
        cancelButtonText: "Annuler",
        confirmButtonColor: "#3b9452",
      });
      if (!confirm.isConfirmed) return;

      // 3. Écriture par lots (limite Firestore : 500 opérations par lot)
      for (let i = 0; i < pending.length; i += 400) {
        const batch = writeBatch(db);
        pending.slice(i, i + 400).forEach(({ ref, updates }) => batch.update(ref, updates));
        await batch.commit();
      }
      await logAdminAction("update", "settings", `Tirets longs remplacés dans ${pending.length} élément(s)`);
      setResult(`${pending.length} élément(s) corrigé(s). ${counts.join(", ")}.`);
      notify("Tirets remplacés.");
    } catch (err) {
      console.error("Erreur nettoyage des tirets :", err);
      notify("Erreur : " + (err as Error).message, "error");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="admin-panel">
      <h2><i className="fas fa-broom me-2"></i>Nettoyage du texte</h2>
      <p className="small text-muted">
        Remplace les tirets longs (— et –) par des tirets courts (-) dans le contenu déjà enregistré : offres,
        événements, fiches, quiz, news et annuaires. Les nouveaux contenus sont corrigés automatiquement.
      </p>
      <button className="btn-sala-primary" onClick={run} disabled={running}>
        {running ? "Analyse en cours..." : "Rechercher et remplacer"}
      </button>
      {result && <div className="alert alert-success small mt-3 mb-0">{result}</div>}
    </div>
  );
}
