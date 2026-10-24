import { describe, expect, it } from "vitest";
import { companyMatches, companyWords } from "@/lib/company-match";

describe("companyWords", () => {
  it("retire accents, ponctuation et forme juridique", () => {
    expect(companyWords("MTN CONGO S.A.")).toEqual(["mtn", "congo"]);
    expect(companyWords("Société Générale Congo SARL")).toEqual(["generale", "congo"]);
    expect(companyWords("A.G.C. VIE")).toEqual(["agc", "vie"]);
    expect(companyWords("M.V.P")).toEqual(["mvp"]);
  });
});

describe("companyMatches", () => {
  it("reconnaît le même nom écrit différemment", () => {
    expect(companyMatches("MTN CONGO S.A.", "MTN Congo")).toBe(true);
    expect(companyMatches("Total Énergies", "TotalEnergies")).toBe(true);
  });
  it("accepte un nom contenu dans l'autre, mot pour mot", () => {
    expect(companyMatches("MTN", "MTN Congo")).toBe(true);
    expect(companyMatches("Banque Postale du Congo", "Banque Postale")).toBe(true);
  });
  it("refuse des entreprises différentes", () => {
    expect(companyMatches("Airtel Congo", "MTN Congo")).toBe(false);
    expect(companyMatches("Congo Telecom", "MTN Congo")).toBe(false);
    expect(companyMatches("Ecobank", "Eco Oil")).toBe(false);
  });
  it("refuse les noms trop courts ou vides", () => {
    expect(companyMatches("BG", "BG Construction")).toBe(false);
    expect(companyMatches("", "MTN")).toBe(false);
    expect(companyMatches("S.A.", "MTN S.A.")).toBe(false);
  });
  it("refuse un nom fait seulement de mots courants", () => {
    expect(companyMatches("Congo", "Jardin du Congo")).toBe(false);
    expect(companyMatches("Congo SA", "AIRTEL CONGO")).toBe(false);
  });
  it("reconnaît les sigles avec ou sans points", () => {
    expect(companyMatches("AGC Vie", "A.G.C. VIE")).toBe(true);
    expect(companyMatches("Air Liquide SCGI", "AIR LIQUIDE S.C.G.I.")).toBe(true);
  });
});
