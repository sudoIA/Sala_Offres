// src/lib/api/server-data.ts
// Lecture de Firestore pour l'API publique /api/v1 (lecture seule).
//
// En production, SDK Admin (compte de service) : non soumis à App Check ni
// aux règles, l'API continue donc de fonctionner le jour où App Check est
// activé sur Firestore. En local (pas de compte de service), SDK client.
// Les documents sont rendus en objets simples, dates en chaînes ISO.
//
// Petit cache mémoire par instance serveur (5 min) : en plus du cache CDN
// (en-têtes Cache-Control), il évite de relire toute une collection à
// chaque requête qui passerait le CDN.

import { collection, doc, getDoc, getDocs, query, Timestamp, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getAdminDb, hasAdminCredentials } from "@/lib/firebase-admin";

export type PlainDoc = { id: string } & Record<string, unknown>;

const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, { at: number; promise: Promise<unknown> }>();

function cached<T>(key: string, load: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.promise as Promise<T>;
  const promise = load();
  if (cache.size > 500) cache.clear(); // borne la mémoire (identifiants arbitraires dans l'URL)
  cache.set(key, { at: Date.now(), promise });
  // Une erreur ne doit pas rester en cache 5 minutes.
  promise.catch(() => cache.delete(key));
  return promise;
}

/** Timestamp Firestore (Admin ou client) -> chaîne ISO ; le reste, récursivement. */
export function toPlain(value: unknown): unknown {
  if (value && typeof value === "object") {
    const maybeTs = value as { toDate?: () => Date };
    if (typeof maybeTs.toDate === "function") return maybeTs.toDate().toISOString();
    if (value instanceof Date) return value.toISOString();
    if (Array.isArray(value)) return value.map(toPlain);
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = toPlain(v);
    return out;
  }
  return value;
}

/** Filtre facultatif : date postérieure à maintenant, ou égalité. */
export type CollectionFilter = { after: string } | { equals: [string, string | boolean] };

/**
 * Documents d'une collection, éventuellement filtrés côté Firestore : offres
 * non expirées ({ after: "deadline" }), articles visibles ({ equals:
 * ["visibility", true] }, exigé par les règles pour une lecture publique).
 */
export function readCollection(name: string, filter?: CollectionFilter): Promise<PlainDoc[]> {
  return cached(`${name}|${JSON.stringify(filter || null)}`, async () => {
    const now = new Date();
    if (hasAdminCredentials()) {
      const ref = getAdminDb().collection(name);
      const q = !filter ? ref : "after" in filter ? ref.where(filter.after, ">", now) : ref.where(filter.equals[0], "==", filter.equals[1]);
      const snap = await q.get();
      return snap.docs.map((d) => ({ id: d.id, ...(toPlain(d.data()) as Record<string, unknown>) }));
    }
    const ref = collection(db, name);
    const constraint = !filter
      ? null
      : "after" in filter
        ? where(filter.after, ">", Timestamp.fromDate(now))
        : where(filter.equals[0], "==", filter.equals[1]);
    const snap = await getDocs(constraint ? query(ref, constraint) : ref);
    return snap.docs.map((d) => ({ id: d.id, ...(toPlain(d.data()) as Record<string, unknown>) }));
  });
}

/** Un document, ou null s'il n'existe pas. */
export function readDocument(name: string, id: string): Promise<PlainDoc | null> {
  return cached(`${name}/${id}`, async () => {
    if (hasAdminCredentials()) {
      const snap = await getAdminDb().collection(name).doc(id).get();
      return snap.exists ? { id: snap.id, ...(toPlain(snap.data()) as Record<string, unknown>) } : null;
    }
    const snap = await getDoc(doc(db, name, id));
    return snap.exists() ? { id: snap.id, ...(toPlain(snap.data()) as Record<string, unknown>) } : null;
  });
}
