// src/components/profile/AccountDeletionPanel.tsx
// Suppression du compte par le candidat lui-même (droit à l'effacement) :
// confirmation explicite, reconnexion exigée par Firebase, puis effacement
// des CV, du profil et du compte (voir deleteCandidateAccount).

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import type { User } from "firebase/auth";
import { deleteCandidateAccount, reauthenticate } from "@/lib/candidate-profile";
import { notify } from "@/lib/notify";

export function AccountDeletionPanel({ user }: { user: User }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const usesPassword = user.providerData.some((p) => p.providerId === "password");

  async function handleDelete() {
    const confirm = await Swal.fire({
      title: "Supprimer définitivement votre compte ?",
      html:
        "Votre profil, vos CV enregistrés et vos alertes seront effacés. <strong>Cette action est irréversible.</strong>" +
        (usesPassword ? "<br><br>Pour confirmer, saisissez votre mot de passe :" : ""),
      icon: "warning",
      input: usesPassword ? "password" : undefined,
      inputPlaceholder: "Mot de passe",
      showCancelButton: true,
      confirmButtonText: "Supprimer mon compte",
      cancelButtonText: "Annuler",
      confirmButtonColor: "#e30613",
      inputValidator: (value: string) => (usesPassword && !value ? "Le mot de passe est requis." : undefined),
    });
    if (!confirm.isConfirmed) return;

    setDeleting(true);
    try {
      await reauthenticate(user, usesPassword ? String(confirm.value) : undefined);
      await deleteCandidateAccount(user);
      notify("Votre compte a été supprimé.");
      router.replace("/");
    } catch (err) {
      const code = (err as { code?: string }).code || "";
      console.error("Suppression du compte impossible :", err);
      const message = ["auth/wrong-password", "auth/invalid-credential"].includes(code)
        ? "Mot de passe incorrect."
        : code === "auth/popup-closed-by-user"
          ? "Reconnexion annulée."
          : "Suppression impossible : " + (err as Error).message;
      notify(message, "error");
      setDeleting(false);
    }
  }

  return (
    <div>
      <h5 className="fw-bold mb-2 text-danger">Supprimer mon compte</h5>
      <p className="text-muted small mb-3">
        Supprime définitivement votre compte Sala et toutes les données associées (profil, CV enregistrés, alertes
        emploi). Vous pourrez toujours consulter les offres sans compte.
      </p>
      <button type="button" className="btn btn-outline-danger btn-sm rounded-pill px-3" onClick={handleDelete} disabled={deleting}>
        <i className="fas fa-user-times me-1"></i> {deleting ? "Suppression..." : "Supprimer mon compte"}
      </button>
    </div>
  );
}
