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
