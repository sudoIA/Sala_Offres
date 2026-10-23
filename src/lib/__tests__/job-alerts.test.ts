import { describe, expect, it } from "vitest";
import { EMPTY_JOB_ALERTS, jobMatchesAlert, parseKeywords } from "@/lib/job-alerts";

const job = {
  title: "Comptable confirmé (H/F)",
  company: "Congolaise de Microfinance",
  city: "BRAZZAVILLE",
  contract: "Contrat à durée indéterminée",
  body: "<p>Tenir la <strong>comptabilité</strong> générale.</p>",
};

describe("parseKeywords", () => {
  it("découpe, nettoie et dédoublonne (sans tenir compte des accents)", () => {
    expect(parseKeywords(" comptable, Comptable ,  ,logistique, Logístique")).toEqual(["comptable", "logistique"]);
  });

  it("limite à 10 mots-clés", () => {
    expect(parseKeywords(Array.from({ length: 15 }, (_, i) => `mot${i}`).join(","))).toHaveLength(10);
  });
});

describe("jobMatchesAlert", () => {
  it("sans critère, toute offre correspond", () => {
    expect(jobMatchesAlert(job, { ...EMPTY_JOB_ALERTS, enabled: true })).toBe(true);
  });

  it("compare la ville sans tenir compte de la casse", () => {
    expect(jobMatchesAlert(job, { ...EMPTY_JOB_ALERTS, city: "Brazzaville" })).toBe(true);
    expect(jobMatchesAlert(job, { ...EMPTY_JOB_ALERTS, city: "Pointe-Noire" })).toBe(false);
  });

  it("reconnaît le contrat sous ses différentes formulations", () => {
    expect(jobMatchesAlert(job, { ...EMPTY_JOB_ALERTS, contract: "CDI" })).toBe(true);
    expect(jobMatchesAlert(job, { ...EMPTY_JOB_ALERTS, contract: "CDD" })).toBe(false);
    expect(jobMatchesAlert({ ...job, contract: "CDD" }, { ...EMPTY_JOB_ALERTS, contract: "CDD" })).toBe(true);
  });

  it("cherche les mots-clés dans le titre, l'entreprise et la description (hors balises)", () => {
    expect(jobMatchesAlert(job, { ...EMPTY_JOB_ALERTS, keywords: ["comptabilite"] })).toBe(true);
    expect(jobMatchesAlert(job, { ...EMPTY_JOB_ALERTS, keywords: ["microfinance"] })).toBe(true);
    expect(jobMatchesAlert(job, { ...EMPTY_JOB_ALERTS, keywords: ["strong"] })).toBe(false);
    expect(jobMatchesAlert(job, { ...EMPTY_JOB_ALERTS, keywords: ["développeur", "comptable"] })).toBe(true);
  });
});
