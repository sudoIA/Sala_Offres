// src/lib/notify.ts
// Petites notifications et confirmations SweetAlert2, utilisées dans tout le
// back-office admin.

import Swal from "sweetalert2";

export function notify(title: string, icon: "success" | "error" = "success") {
  Swal.fire({ title, icon, showConfirmButton: false, timer: 1600 });
}

export async function confirmDelete(label: string): Promise<boolean> {
  const result = await Swal.fire({
    title: "Supprimer ?",
    text: `« ${label} » sera définitivement supprimé.`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Supprimer",
    cancelButtonText: "Annuler",
    confirmButtonColor: "#e30613",
  });
  return result.isConfirmed;
}

export async function confirmAction(title: string, text: string, confirmColor = "#3b9452"): Promise<boolean> {
  const result = await Swal.fire({
    title,
    text,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Confirmer",
    cancelButtonText: "Annuler",
    confirmButtonColor: confirmColor,
  });
  return result.isConfirmed;
}

/** Demande le code à 6 chiffres de l'application d'authentification (null si annulé). */
export async function askMfaCode(): Promise<string | null> {
  const result = await Swal.fire({
    title: "Code de vérification",
    text: "Saisissez le code à 6 chiffres affiché par votre application d'authentification.",
    input: "text",
    inputAttributes: { inputmode: "numeric", autocomplete: "one-time-code", maxlength: "6" },
    showCancelButton: true,
    confirmButtonText: "Valider",
    cancelButtonText: "Annuler",
    confirmButtonColor: "#3b9452",
    inputValidator: (value) => (/^\d{6}$/.test(value.trim()) ? null : "6 chiffres attendus."),
  });
  return result.isConfirmed ? String(result.value).trim() : null;
}

/** Demande un texte court (null si annulé). */
export async function askText(title: string, label: string, initial = ""): Promise<string | null> {
  const result = await Swal.fire({
    title,
    input: "text",
    inputLabel: label,
    inputValue: initial,
    showCancelButton: true,
    confirmButtonText: "Enregistrer",
    cancelButtonText: "Annuler",
    confirmButtonColor: "#3b9452",
    inputValidator: (value) => (value.trim() ? null : "Ce champ est obligatoire."),
  });
  return result.isConfirmed ? String(result.value).trim() : null;
}
