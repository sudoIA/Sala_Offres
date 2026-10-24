import { describe, expect, it } from "vitest";
import { delta, lastMonths, monthRange, shiftMonth, toCsv, topCounts } from "@/lib/monthly-report";

describe("mois", () => {
  it("donne les bornes d'un mois", () => {
    const { start, end } = monthRange("2026-10");
    expect([start.getFullYear(), start.getMonth(), start.getDate()]).toEqual([2026, 9, 1]);
    expect([end.getFullYear(), end.getMonth(), end.getDate()]).toEqual([2026, 10, 1]);
  });
  it("passe d'une année à l'autre", () => {
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
    expect(shiftMonth("2025-12", 1)).toBe("2026-01");
    expect(lastMonths("2026-02", 3)).toEqual(["2025-12", "2026-01", "2026-02"]);
  });
});

describe("delta", () => {
  it("calcule l'évolution en pourcentage", () => {
    expect(delta(15, 10)).toEqual({ text: "+50 %", trend: "up" });
    expect(delta(5, 10)).toEqual({ text: "-50 %", trend: "down" });
    expect(delta(7, 7)).toEqual({ text: "=", trend: "flat" });
  });
  it("gère un mois précédent à zéro ou inconnu", () => {
    expect(delta(4, 0)).toEqual({ text: "+4", trend: "up" });
    expect(delta(4, null)).toBeNull();
  });
});

describe("topCounts", () => {
  it("regroupe sans tenir compte de la casse et classe", () => {
    expect(topCounts(["MTN", "mtn", "Airtel", "", null, "Ecobank", "Airtel", "MTN"], 2)).toEqual([
      { label: "MTN", count: 3 },
      { label: "Airtel", count: 2 },
    ]);
  });
});

describe("toCsv", () => {
  it("échappe les cellules et commence par le BOM pour Excel", () => {
    const csv = toCsv([["Offres; publiées", 12, null]]);
    expect(csv.startsWith("\uFEFFIndicateur;Ce mois;Mois précédent\r\n")).toBe(true);
    expect(csv.endsWith('"Offres; publiées";12;')).toBe(true);
  });
});
