import { describe, expect, it } from "vitest";
import { addAttempt, earnedBadges, mergeResults, newlyEarned } from "@/lib/quiz-badges";

const at = new Date("2026-10-24T12:00:00Z");
const keys = (list: { key: string }[]) => list.map((b) => b.key);

describe("earnedBadges", () => {
  it("aucun badge sans tentative", () => {
    expect(earnedBadges(undefined)).toEqual([]);
  });
  it("débloque les niveaux selon la part de bonnes réponses", () => {
    expect(keys(earnedBadges(addAttempt(undefined, 3, 10, at)))).toEqual(["premier-pas"]);
    expect(keys(earnedBadges(addAttempt(undefined, 6, 10, at)))).toEqual(["premier-pas", "bon-niveau"]);
    expect(keys(earnedBadges(addAttempt(undefined, 8, 10, at)))).toEqual(["premier-pas", "bon-niveau", "expert"]);
    expect(keys(earnedBadges(addAttempt(undefined, 10, 10, at)))).toHaveLength(4);
  });
});

describe("addAttempt", () => {
  it("garde le meilleur score et compte les tentatives", () => {
    const first = addAttempt(undefined, 8, 10, at);
    const second = addAttempt(first, 5, 10, at);
    expect(second).toMatchObject({ best: 8, total: 10, attempts: 2 });
  });
  it("compare en proportion si le nombre de questions change", () => {
    const first = addAttempt(undefined, 7, 10, at);
    expect(addAttempt(first, 9, 12, at)).toMatchObject({ best: 9, total: 12 });
  });
});

describe("newlyEarned", () => {
  it("ne renvoie que les badges gagnés par cette tentative", () => {
    const before = addAttempt(undefined, 6, 10, at);
    const after = addAttempt(before, 10, 10, at);
    expect(keys(newlyEarned(before, after))).toEqual(["expert", "sans-faute"]);
    expect(newlyEarned(after, addAttempt(after, 2, 10, at))).toEqual([]);
  });
});

describe("mergeResults", () => {
  it("fusionne appareil et profil en gardant le meilleur", () => {
    const local = { entretiens: { best: 5, total: 10, attempts: 4, lastAt: "2026-10-01" } };
    const remote = { entretiens: { best: 9, total: 10, attempts: 2, lastAt: "2026-10-20" }, droit_du_travail: { best: 3, total: 10, attempts: 1, lastAt: "2026-10-02" } };
    expect(mergeResults(local, remote)).toEqual({
      entretiens: { best: 9, total: 10, attempts: 4, lastAt: "2026-10-20" },
      droit_du_travail: remote.droit_du_travail,
    });
  });
  it("ignore les données mal formées", () => {
    expect(mergeResults({ entretiens: { best: "x" } } as never, {})).toEqual({});
  });
});
