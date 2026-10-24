import { describe, expect, it } from "vitest";
import { eventContactLinks, isEventCurrent, normalizePhone } from "@/lib/event-helpers";

const now = new Date("2026-10-24T12:00:00Z");
const d = (iso: string) => new Date(iso);

describe("isEventCurrent", () => {
  it("garde un événement commencé mais pas encore terminé", () => {
    expect(isEventCurrent({ deadlineDate: d("2026-09-10T14:00:00Z"), deadline2Date: d("2026-10-25T22:59:00Z") }, now)).toBe(true);
  });
  it("retire un événement terminé", () => {
    expect(isEventCurrent({ deadlineDate: d("2026-09-10T14:00:00Z"), deadline2Date: d("2026-10-20T00:00:00Z") }, now)).toBe(false);
  });
  it("sans date de fin, se base sur la date de début", () => {
    expect(isEventCurrent({ deadlineDate: d("2026-11-01T00:00:00Z"), deadline2Date: null }, now)).toBe(true);
    expect(isEventCurrent({ deadlineDate: d("2026-10-01T00:00:00Z"), deadline2Date: null }, now)).toBe(false);
  });
  it("sans aucune date, reste affiché", () => {
    expect(isEventCurrent({ deadlineDate: null, deadline2Date: null }, now)).toBe(true);
  });
});

describe("normalizePhone", () => {
  it("convertit les formats saisis dans l'app", () => {
    expect(normalizePhone("00242 068477993 ")).toBe("+242068477993");
    expect(normalizePhone("06 847 79 93")).toBe("+242068477993");
    expect(normalizePhone("+242 05 51 35 62")).toBe("+24205513562");
  });
  it("refuse ce qui n'est pas un numéro", () => {
    expect(normalizePhone("")).toBeNull();
    expect(normalizePhone("voir affiche")).toBeNull();
  });
});

describe("eventContactLinks", () => {
  it("propose lien d'inscription, appel, WhatsApp et e-mail", () => {
    const links = eventContactLinks({ site: "http://osiane.cg/", tel: "00242 068477993", email: "contact@osiane.cg" });
    expect(links.map((l) => [l.kind, l.href])).toEqual([
      ["site", "http://osiane.cg/"],
      ["tel", "tel:+242068477993"],
      ["whatsapp", "https://wa.me/242068477993"],
      ["email", "mailto:contact@osiane.cg"],
    ]);
  });
  it("reconnaît un groupe WhatsApp", () => {
    expect(eventContactLinks({ site: "https://chat.whatsapp.com/abc" })[0].kind).toBe("whatsapp-group");
  });
  it("ignore liens dangereux et e-mails invalides", () => {
    expect(eventContactLinks({ site: "javascript:alert(1)", email: "pas un email" })).toEqual([]);
  });
});
