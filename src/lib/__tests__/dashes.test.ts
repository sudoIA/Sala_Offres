import { describe, expect, it } from "vitest";
import { dashFieldUpdates, normalizeDashes, replaceLongDashes } from "@/lib/dashes";

describe("replaceLongDashes", () => {
  it("remplace tirets cadratin et demi-cadratin par un tiret court", () => {
    expect(replaceLongDashes("Sala — Emplois – Congo")).toBe("Sala - Emplois - Congo");
  });
});

describe("normalizeDashes", () => {
  it("traite objets et tableaux, laisse le reste intact", () => {
    const date = new Date("2026-10-24");
    const out = normalizeDashes({ title: "A — B", tags: ["x – y"], options: [{ text: "—" }], n: 3, at: date });
    expect(out).toEqual({ title: "A - B", tags: ["x - y"], options: [{ text: "-" }], n: 3, at: date });
    expect(out.at).toBe(date);
  });
});

describe("dashFieldUpdates", () => {
  it("ne renvoie que les champs modifiés", () => {
    expect(dashFieldUpdates({ title: "A — B", city: "Brazzaville" })).toEqual({ title: "A - B" });
  });
  it("renvoie null quand il n'y a rien à changer", () => {
    expect(dashFieldUpdates({ title: "A - B" })).toBeNull();
  });
});
