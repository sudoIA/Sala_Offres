// src/lib/storage-upload.ts
// Envoi d'une image publique (logo, photo) dans Firebase Storage depuis le
// back-office, par l'API web de Storage plutôt que le SDK firebase/storage
// (même choix que storage-lookup.ts, pour ne pas alourdir les pages). Les
// règles Storage n'autorisent l'écriture qu'aux administrateurs ; la lecture
// est publique, l'URL renvoyée s'affiche donc partout (site, app, API).

import { auth, STORAGE_BUCKET } from "@/lib/firebase";
import { publicStorageUrl } from "@/lib/storage-lookup";

const MAX_BYTES = 2 * 1024 * 1024;
const EXTENSIONS: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/svg+xml": "svg", "image/gif": "gif" };

function slug(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

/** Envoie `file` dans `folder` (nom tiré de `nameHint`) et renvoie son URL publique. */
export async function uploadPublicImage(folder: string, file: File, nameHint: string): Promise<string> {
  const ext = EXTENSIONS[file.type];
  if (!ext) throw new Error("Choisissez une image PNG, JPG, WebP, SVG ou GIF.");
  if (file.size > MAX_BYTES) throw new Error("Image trop lourde : 2 Mo au maximum.");
  const idToken = await auth.currentUser?.getIdToken();
  if (!idToken) throw new Error("Session expirée, reconnectez-vous.");

  const path = `${folder}/${slug(nameHint) || "image"}-${Date.now().toString(36)}.${ext}`;
  const res = await fetch(`https://firebasestorage.googleapis.com/v0/b/${STORAGE_BUCKET}/o?name=${encodeURIComponent(path)}`, {
    method: "POST",
    headers: { Authorization: `Firebase ${idToken}`, "Content-Type": file.type },
    body: file,
  });
  if (!res.ok) {
    throw new Error(res.status === 403 ? "Envoi refusé : réservé aux administrateurs." : "Envoi de l'image impossible pour le moment.");
  }
  return publicStorageUrl(path);
}
