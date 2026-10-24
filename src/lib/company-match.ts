// src/lib/company-match.ts
// Relie le nom d'entreprise d'une offre (saisi à la main ou collecté :
// "MTN CONGO S.A.", "Total Énergies") à sa fiche de l'annuaire des
// entreprises ("MTN Congo", "TotalEnergies"), pour la page entreprise.
// Comparaison sans accents, casse, ponctuation ni forme juridique ; l'un
// des deux noms peut être contenu dans l'autre, mot pour mot.

// Mots trop courants pour identifier à eux seuls une entreprise ("Congo"
// correspondrait à "Airtel Congo" comme à "Jardin du Congo").
const GENERIC_WORDS = new Set(["congo", "du", "de", "des", "la", "le", "les", "et", "international", "afrique", "africa", "brazzaville", "pointe", "noire", "cg"]);

const LEGAL_FORMS = new Set(["sa", "sarl", "sas", "sasu", "su", "suarl", "ltd", "limited", "inc", "plc", "gie", "ste", "societe", "groupe", "group"]);

/** Mots significatifs du nom : "MTN CONGO S.A." -> ["mtn", "congo"]. */
export function companyWords(name?: string | null): string[] {
  return (name || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\b([a-z])\.(?=[a-z]\b)/g, "$1") // sigles : "a.g.c." -> "agc."
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter((w) => w && !LEGAL_FORMS.has(w));
}

function containsSequence(haystack: string[], needle: string[]): boolean {
  outer: for (let i = 0; i + needle.length <= haystack.length; i++) {
    for (let j = 0; j < needle.length; j++) if (haystack[i + j] !== needle[j]) continue outer;
    return true;
  }
  return false;
}

/** Vrai si les deux noms désignent la même entreprise. */
export function companyMatches(a?: string | null, b?: string | null): boolean {
  const x = companyWords(a);
  const y = companyWords(b);
  if (!x.length || !y.length) return false;
  if (x.join("") === y.join("")) return true; // "Total Energies" = "TotalEnergies"
  const [short, long] = x.length <= y.length ? [x, y] : [y, x];
  // Un nom trop court ("BG") correspondrait à n'importe quoi.
  if (short.join("").length < 3 || short.every((w) => GENERIC_WORDS.has(w))) return false;
  return containsSequence(long, short);
}
