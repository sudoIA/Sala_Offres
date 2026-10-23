// src/lib/admin-log.ts
// Journal des actions du back-office (collection "admin_logs") : qui a
// publié, modifié ou supprimé quoi, et quand. Consultable dans
// Admin > Journal. Les règles Firestore n'autorisent que l'ajout d'entrées
// par un admin, à son propre nom — jamais leur modification ni suppression.
//
// L'écriture du journal ne doit jamais faire échouer l'action elle-même :
// en cas d'erreur, on se contente de la signaler dans la console.

import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export type AdminLogAction = "create" | "update" | "delete" | "publish" | "reject" | "promote" | "demote" | "settings";

/**
 * @param action  nature de l'action
 * @param target  collection concernée (ex : "emplois", "events")
 * @param label   description lisible de l'élément (ex : titre de l'offre)
 * @param targetId identifiant du document, si pertinent
 */
export async function logAdminAction(action: AdminLogAction, target: string, label: string, targetId?: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;
  try {
    await addDoc(collection(db, "admin_logs"), {
      action,
      target,
      label: label.slice(0, 200),
      targetId: targetId || null,
      uid: user.uid,
      email: user.email || "",
      at: serverTimestamp(),
    });
  } catch (err) {
    console.warn("Journal admin non enregistré :", err);
  }
}
