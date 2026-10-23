import { describe, expect, it } from "vitest";
import { DEFAULT_DEADLINE_DAYS, findDuplicatePublishedJob, importToJobData } from "@/lib/job-import-helpers";
import type { ImportedJob } from "@/types/job-import";
import type { Job } from "@/types/job";

const imported: ImportedJob = {
  title: "Chargé(e) des opérations",
  company: "CONGOLAISE DE MICROFINANCE",
  city: "BRAZZAVILLE",
  contract: "CDI",
  description: "<p>Description</p>",
  source: "acpe",
  sourceUrl: "https://acpe.cg/public/details-offre-emplois/4633",
  sourceId: "4633",
  status: "pending",
  importedAt: "2026-10-23T08:00:00.000Z",
};

describe("findDuplicatePublishedJob", () => {
  const published = [
    { id: "a", title: "Chargé(e) des Opérations", company: "Congolaise de Microfinance", city: "Brazzaville", deadlineDate: null },
  ] as Job[];

  it("détecte un doublon malgré la casse, les accents et la ponctuation", () => {
    expect(findDuplicatePublishedJob(imported, published)?.id).toBe("a");
  });

  it("ne compare pas une offre sans entreprise ou sans ville", () => {
    expect(findDuplicatePublishedJob({ ...imported, city: undefined }, published)).toBeNull();
  });
});

describe("importToJobData", () => {
  const now = new Date("2026-10-23T08:00:00Z");

  it("reprend la date limite de la source", () => {
    const data = importToJobData({ ...imported, deadline: "2026-11-11" }, now);
    expect(data.deadline.getFullYear()).toBe(2026);
    expect(data.deadline.getMonth()).toBe(10);
    expect(data.deadline.getDate()).toBe(11);
  });

  it(`applique ${DEFAULT_DEADLINE_DAYS} jours par défaut sans date limite`, () => {
    const data = importToJobData(imported, now);
    expect(data.deadline.getTime() - now.getTime()).toBe(DEFAULT_DEADLINE_DAYS * 24 * 3600 * 1000);
  });

  it("produit une offre visible, avec email vide et lien vers l'annonce d'origine", () => {
    const data = importToJobData(imported, now);
    expect(data.visibility).toBe(true);
    expect(data.email).toBe("");
    expect(data.site).toBe(imported.sourceUrl);
    expect(data.body).toBe("<p>Description</p>");
  });
});
