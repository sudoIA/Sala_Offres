import { describe, expect, it } from "vitest";
import {
  isEventVisible,
  isJobActive,
  matchesJobFilters,
  toApiAnnuaire,
  toApiEvent,
  toApiFiche,
  toApiJob,
  toApiQuiz,
} from "@/lib/api/serializers";
import { toPlain } from "@/lib/api/server-data";

const SITE = "https://www.ongsala.com";
const now = new Date("2026-10-24T12:00:00Z");

describe("toPlain", () => {
  it("convertit les Timestamp Firestore en ISO, récursivement", () => {
    const ts = { toDate: () => new Date("2026-11-01T00:00:00Z") };
    expect(toPlain({ deadline: ts, list: [ts], n: 1 })).toEqual({
      deadline: "2026-11-01T00:00:00.000Z",
      list: ["2026-11-01T00:00:00.000Z"],
      n: 1,
    });
  });
});

describe("offres", () => {
  const doc = {
    id: "job1",
    title: " Comptable ",
    company: "MTN Congo",
    city: "Pointe-Noire",
    contract: "CDI",
    body: "<p>Gérer la paie</p><script>alert(1)</script>",
    site: "javascript:alert(1)",
    timestamp: "2026-10-20T00:00:00.000Z",
    deadline: "2026-11-20T00:00:00.000Z",
    visibility: true,
  };

  it("exclut les offres masquées ou expirées", () => {
    expect(isJobActive(doc, now)).toBe(true);
    expect(isJobActive({ ...doc, visibility: false }, now)).toBe(false);
    expect(isJobActive({ ...doc, deadline: "2026-10-01T00:00:00.000Z" }, now)).toBe(false);
  });

  it("assainit la description et les liens", () => {
    const job = toApiJob(doc, SITE);
    expect(job.title).toBe("Comptable");
    expect(job.description).not.toContain("<script>");
    expect(job.descriptionText).toBe("Gérer la paie");
    expect(job.site).toBeNull();
    expect(job.url).toBe("https://www.ongsala.com/offres/job1");
  });

  it("filtre sans tenir compte des accents ni de la casse", () => {
    const job = toApiJob({ ...doc, title: "Comptable expérimenté" }, SITE);
    expect(matchesJobFilters(job, { ville: "pointe-noire", contrat: "cdi", q: "experimente comptable" })).toBe(true);
    expect(matchesJobFilters(job, { ville: "Brazzaville" })).toBe(false);
    expect(matchesJobFilters(job, { contrat: "Stage" })).toBe(false);
  });
});

describe("événements", () => {
  it("visible jusqu'à la date de fin, avec liens de contact", () => {
    const d = { id: "e1", title: "Salon", deadline: "2026-10-01T00:00:00.000Z", deadline2: "2026-10-30T00:00:00.000Z", tel: "06 847 79 93" };
    expect(isEventVisible(d, now)).toBe(true);
    expect(isEventVisible({ ...d, deadline2: "2026-10-10T00:00:00.000Z" }, now)).toBe(false);
    expect(toApiEvent(d, SITE).contactLinks.map((l) => l.kind)).toEqual(["tel", "whatsapp"]);
  });
});

describe("fiches, quiz, annuaires", () => {
  it("fiche : valeurs par défaut et lien source sûr", () => {
    const f = toApiFiche({ id: "f1", title: "CDD", sourceUrl: "https://www.sgg.cg/code.pdf" });
    expect(f).toMatchObject({ order: 0, readingTime: "1", sourceUrl: "https://www.sgg.cg/code.pdf", faqQuestion: null });
  });

  it("quiz : options normalisées", () => {
    const q = toApiQuiz({ id: "q1", theme: "entretiens", order: 2, question: "Q ?", options: [{ text: "A", correct: true }, { text: "B" }] });
    expect(q.options).toEqual([
      { text: "A", correct: true, explanation: "" },
      { text: "B", correct: false, explanation: "" },
    ]);
  });

  it("annuaire : reprend les anciens champs (tel, site, contenu)", () => {
    const item = toApiAnnuaire({ id: "u1", name: "UMNG", tel: "06 000", site: "www.umng.cg", contenu: "Université publique" }, "universites");
    expect(item).toMatchObject({ phones: ["06 000"], website: "https://www.umng.cg/", description: "Université publique" });
  });
});
