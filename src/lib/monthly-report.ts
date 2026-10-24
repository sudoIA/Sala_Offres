// src/lib/monthly-report.ts
// Calculs du rapport mensuel d'activité (Admin > Rapport mensuel) : bornes
// d'un mois, comparaison au mois précédent, classements, export CSV. Les
// lectures Firestore sont dans src/hooks/useMonthlyReport.ts.

export interface MonthRange {
  start: Date;
  end: Date; // exclu
}

/** "2026-10" -> du 1er octobre 2026 00:00 au 1er novembre 00:00 (heure locale). */
export function monthRange(key: string): MonthRange {
  const [y, m] = key.split("-").map(Number);
  return { start: new Date(y, m - 1, 1), end: new Date(y, m, 1) };
}

/** Clé du mois décalé de `offset` mois ("2026-01", -1 -> "2025-12"). */
export function shiftMonth(key: string, offset: number): string {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(y, m - 1 + offset, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** Les `count` mois se terminant par `key`, du plus ancien au plus récent. */
export function lastMonths(key: string, count: number): string[] {
  return Array.from({ length: count }, (_, i) => shiftMonth(key, i - count + 1));
}

/** "octobre 2026". */
export function monthLabel(key: string): string {
  return monthRange(key).start.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
}

/** "oct." pour les petits libellés de graphique. */
export function monthShortLabel(key: string): string {
  return monthRange(key).start.toLocaleDateString("fr-FR", { month: "short" });
}

export interface Delta {
  text: string;
  trend: "up" | "down" | "flat";
}

/** Évolution par rapport au mois précédent ("+25 %", "-3", "="), null si non comparable. */
export function delta(current: number | null, previous: number | null): Delta | null {
  if (current === null || previous === null) return null;
  if (current === previous) return { text: "=", trend: "flat" };
  const trend = current > previous ? "up" : "down";
  if (previous === 0) return { text: `+${current}`, trend };
  const pct = Math.round(((current - previous) / previous) * 100);
  return { text: `${pct > 0 ? "+" : ""}${pct} %`, trend };
}

export interface RankedItem {
  label: string;
  count: number;
}

/** Classement des valeurs les plus fréquentes (regroupées sans tenir compte de la casse). */
export function topCounts(values: (string | null | undefined)[], limit = 5): RankedItem[] {
  const groups = new Map<string, RankedItem>();
  for (const raw of values) {
    const label = (raw || "").trim();
    if (!label) continue;
    const key = label.toLocaleLowerCase("fr");
    const item = groups.get(key);
    if (item) item.count++;
    else groups.set(key, { label, count: 1 });
  }
  return [...groups.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "fr")).slice(0, limit);
}

/** Une ligne CSV par indicateur (séparateur « ; » pour Excel en français). */
export function toCsv(rows: [string, string | number | null, string | number | null][]): string {
  const cell = (v: string | number | null) => {
    const s = v === null ? "" : String(v);
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return "\uFEFF" + [["Indicateur", "Ce mois", "Mois précédent"], ...rows].map((r) => r.map(cell).join(";")).join("\r\n");
}
