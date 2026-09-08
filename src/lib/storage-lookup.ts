// src/lib/storage-lookup.ts
// Recherche générique d'un fichier dans un dossier Firebase Storage à partir
// d'un mot-clé partiel (ex : "eco" -> "ecobank-fintech.jpg", "Air France" ->
// "airFrance.jpg") — utilisé pour les affiches d'événements et les logos
// d'entreprise, qui suivent tous les deux cette même convention côté
// mobile : un champ Firestore contient un mot-clé, pas le nom de fichier
// exact ni une URL.

import { getDownloadURL, listAll, ref } from "firebase/storage";
import { storage } from "@/lib/firebase";

const folderCache = new Map<string, Promise<string[]>>();

function listStorageFolder(folder: string): Promise<string[]> {
  if (!folderCache.has(folder)) {
    const promise = listAll(ref(storage, folder))
      .then((res) => res.items.map((item) => item.name))
      .catch((err) => {
        console.error(`Erreur listage du dossier Storage "${folder}" :`, err);
        folderCache.delete(folder); // permet de réessayer au prochain appel
        return [];
      });
    folderCache.set(folder, promise);
  }
  return folderCache.get(folder)!;
}

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]/g, "");
}

interface FindStorageFileOptions {
  /**
   * Autorise aussi la correspondance "le mot-clé contient le nom du
   * fichier" (utile pour un nom d'entreprise complet comme "Air France"
   * face à un fichier court "airFrance.jpg"). Désactivé par défaut : seule
   * la correspondance "le fichier contient le mot-clé" est essayée, comme
   * pour les affiches d'événements (mot-clé court, ex : "eco").
   */
  bidirectional?: boolean;
}

/**
 * Cherche dans `folder` un fichier dont le nom correspond à `keyword` une
 * fois les deux normalisés (minuscules, sans espaces ni ponctuation), puis
 * renvoie son URL de téléchargement publique. Renvoie null si rien ne
 * correspond. Priorité : correspondance exacte, puis "le fichier contient
 * le mot-clé", puis (si `bidirectional`) "le mot-clé contient le fichier".
 */
export async function findStorageFileUrl(
  folder: string,
  keyword?: string | null,
  options: FindStorageFileOptions = {}
): Promise<string | null> {
  const needle = normalize(keyword || "");
  if (!needle) return null;

  const files = await listStorageFolder(folder);
  const withBase = files
    .map((name) => ({ name, base: normalize(name.replace(/\.[^.]+$/, "")) }))
    .filter((f) => f.base);

  const match =
    withBase.find((f) => f.base === needle) ||
    withBase.find((f) => f.base.includes(needle)) ||
    (options.bidirectional ? withBase.find((f) => f.base.length >= 3 && needle.includes(f.base)) : undefined);

  if (!match) return null;

  try {
    return await getDownloadURL(ref(storage, `${folder}/${match.name}`));
  } catch (err) {
    console.error(`Erreur récupération de l'URL Storage (${folder}/${match.name}) :`, err);
    return null;
  }
}
