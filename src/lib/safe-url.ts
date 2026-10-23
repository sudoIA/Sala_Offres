// src/lib/safe-url.ts
// Les liens externes (site d'une offre, d'un événement, réseaux sociaux...)
// viennent de saisies admin ou de sites importés : on n'accepte que des
// adresses http(s), pour qu'un lien "javascript:..." saisi par erreur ou
// recopié depuis une source ne puisse jamais s'exécuter au clic.

/** Renvoie une URL http(s) sûre, ou `null` si la valeur n'en est pas une. */
export function safeExternalUrl(value: string | null | undefined): string | null {
  const raw = (value || "").trim();
  if (!raw) return null;
  // "www.exemple.com" saisi sans protocole : on complète plutôt que d'ignorer.
  const candidate = /^www\./i.test(raw) ? `https://${raw}` : raw;
  try {
    const url = new URL(candidate);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
}
