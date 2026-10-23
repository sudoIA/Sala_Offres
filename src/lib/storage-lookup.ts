// src/lib/storage-lookup.ts
// Recherche générique d'un fichier dans un dossier Firebase Storage à partir
// d'un mot-clé partiel (ex : "eco" -> "ecobank-fintech.jpg", "Air France" ->
// "airFrance.jpg") — utilisé pour les affiches d'événements et les logos
// d'entreprise, qui suivent tous les deux cette même convention côté
// mobile : un champ Firestore contient un mot-clé, pas le nom de fichier
// exact ni une URL.
//
// Performance : on passe par l'API web publique de Storage (lecture publique
// autorisée par storage.rules) plutôt que par le SDK firebase/storage, qui
// alourdissait toutes les pages. Le contenu d'un dossier est gardé 12 h sur
// l'appareil, et l'URL publique d'un fichier se construit directement, sans
// une requête supplémentaire par logo comme le faisait getDownloadURL.

import { STORAGE_BUCKET } from "@/lib/firebase";

const STORAGE_API = `https://firebasestorage.googleapis.com/v0/b/${STORAGE_BUCKET}/o`;
const LIST_CACHE_PREFIX = "sala_storage_list_";
const LIST_CACHE_TTL_MS = 12 * 3600 * 1000;

const folderCache = new Map<string, Promise<string[]>>();

function readCachedList(folder: string): string[] | null {
  try {
    const raw = localStorage.getItem(LIST_CACHE_PREFIX + folder);
    if (!raw) return null;
    const { savedAt, names } = JSON.parse(raw) as { savedAt: number; names: string[] };
    return Date.now() - savedAt < LIST_CACHE_TTL_MS && Array.isArray(names) ? names : null;
  } catch {
    return null;
  }
}

function writeCachedList(folder: string, names: string[]): void {
  try {
    localStorage.setItem(LIST_CACHE_PREFIX + folder, JSON.stringify({ savedAt: Date.now(), names }));
  } catch {
    // Stockage plein ou indisponible : le cache mémoire suffit.
  }
}

async function fetchFolderNames(folder: string): Promise<string[]> {
  const names: string[] = [];
  let pageToken = "";
  do {
    const params = new URLSearchParams({ prefix: `${folder}/`, delimiter: "/", maxResults: "1000" });
    if (pageToken) params.set("pageToken", pageToken);
    const res = await fetch(`${STORAGE_API}?${params}`);
    if (!res.ok) throw new Error(`Storage a répondu ${res.status}`);
    const data = (await res.json()) as { items?: { name: string }[]; nextPageToken?: string };
    for (const item of data.items || []) names.push(item.name.slice(folder.length + 1));
    pageToken = data.nextPageToken || "";
  } while (pageToken);
  return names;
}

function listStorageFolder(folder: string): Promise<string[]> {
  if (!folderCache.has(folder)) {
    const cached = typeof window !== "undefined" ? readCachedList(folder) : null;
    const promise = cached
      ? Promise.resolve(cached)
      : fetchFolderNames(folder)
          .then((names) => {
            writeCachedList(folder, names);
            return names;
          })
          .catch((err) => {
            console.error(`Erreur listage du dossier Storage "${folder}" :`, err);
            folderCache.delete(folder); // permet de réessayer au prochain appel
            return [];
          });
    folderCache.set(folder, promise);
  }
  return folderCache.get(folder)!;
}

/** URL publique directe d'un fichier (lecture publique, voir storage.rules). */
export function publicStorageUrl(path: string): string {
  return `${STORAGE_API}/${encodeURIComponent(path)}?alt=media`;
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

  return match ? publicStorageUrl(`${folder}/${match.name}`) : null;
}
