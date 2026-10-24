// src/lib/api/images.ts
// Images pour l'API : les champs Firestore contiennent souvent un mot-clé ou
// un nom de fichier à chercher dans Storage (même convention que l'app et le
// site, voir storage-lookup.ts), parfois déjà une URL. Une erreur Storage ne
// fait jamais échouer la réponse : l'image vaut alors null.

import { findStorageFileUrl } from "@/lib/storage-lookup";

function baseName(value: string): string {
  return value.replace(/\.[^.]+$/, "").trim();
}

export async function resolveImage(folder: string, raw: unknown, bidirectional = false): Promise<string | null> {
  const value = typeof raw === "string" ? raw.trim() : "";
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  try {
    return await findStorageFileUrl(folder, baseName(value), { bidirectional });
  } catch {
    return null;
  }
}
