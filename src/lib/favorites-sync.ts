// src/lib/favorites-sync.ts
// Favoris du candidat connecté, gardés dans son profil (users/{uid}.savedJobs,
// liste d'identifiants d'offres) pour les retrouver sur tous ses appareils et
// dans l'application mobile. L'appareil en garde une copie (job-helpers.ts),
// utilisable sans compte.
//
// À la première connexion d'un compte sur un appareil, les favoris des deux
// côtés sont réunis ; ensuite le compte fait foi, pour qu'un favori retiré
// ailleurs (app mobile, autre navigateur) disparaisse aussi ici.

import { arrayRemove, arrayUnion, doc, getDoc, updateDoc } from "firebase/firestore";
import type { User } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { readFavoris, writeFavoris } from "@/lib/job-helpers";

const SYNCED_KEY = "sala_favoris_compte";
/** Plafond des règles Firestore (savedJobs). */
const MAX_SAVED = 500;

function syncedUid(): string | null {
  try {
    return localStorage.getItem(SYNCED_KEY);
  } catch {
    return null;
  }
}

/** Ajoute ou retire un favori dans le profil du candidat connecté (sans attendre). */
export function saveFavoriToAccount(jobId: string, saved: boolean): void {
  const user = auth.currentUser;
  if (!user) return;
  updateDoc(doc(db, "users", user.uid), { savedJobs: saved ? arrayUnion(jobId) : arrayRemove(jobId) }).catch(() => {
    // Pas de profil candidat (compte de l'équipe) ou hors-ligne : favori gardé sur l'appareil.
  });
}

/** Aligne les favoris de l'appareil sur ceux du compte, à la connexion. */
export async function syncFavoritesWithAccount(user: User): Promise<void> {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const remote = (Array.isArray(snap.data().savedJobs) ? snap.data().savedJobs : []).filter((id: unknown): id is string => typeof id === "string");

  if (syncedUid() === user.uid) {
    writeFavoris(remote, true);
    return;
  }
  const local = readFavoris();
  const extra = local.filter((id) => !remote.includes(id)).slice(0, Math.max(0, MAX_SAVED - remote.length));
  if (extra.length) await updateDoc(ref, { savedJobs: arrayUnion(...extra) });
  writeFavoris([...remote, ...extra], true);
  try {
    localStorage.setItem(SYNCED_KEY, user.uid);
  } catch {
    // Stockage indisponible : la réunion sera simplement refaite.
  }
}

/**
 * À la déconnexion : les favoris venus d'un compte y restent enregistrés, on
 * les retire de l'appareil pour qu'ils ne passent pas dans un autre compte.
 */
export function forgetAccountFavorites(): void {
  if (!syncedUid()) return;
  writeFavoris([], true);
  try {
    localStorage.removeItem(SYNCED_KEY);
  } catch {
    // Rien à faire.
  }
}
