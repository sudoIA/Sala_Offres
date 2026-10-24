import { describe, expect, it } from "vitest";
import { isEventCurrent } from "@/lib/event-helpers";

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
