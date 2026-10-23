import { describe, expect, it } from "vitest";
import { safeExternalUrl } from "@/lib/safe-url";

describe("safeExternalUrl", () => {
  it("accepte les adresses http(s)", () => {
    expect(safeExternalUrl("https://acpe.cg/public/details-offre-emplois/4633")).toBe(
      "https://acpe.cg/public/details-offre-emplois/4633"
    );
    expect(safeExternalUrl("http://exemple.cg")).toBe("http://exemple.cg/");
  });

  it("complète une adresse saisie sans protocole", () => {
    expect(safeExternalUrl("www.ongsala.com")).toBe("https://www.ongsala.com/");
  });

  it("refuse les protocoles dangereux et les valeurs invalides", () => {
    expect(safeExternalUrl("javascript:alert(1)")).toBeNull();
    expect(safeExternalUrl(" JavaScript:alert(1)")).toBeNull();
    expect(safeExternalUrl("data:text/html,<script>")).toBeNull();
    expect(safeExternalUrl("pas une url")).toBeNull();
    expect(safeExternalUrl("")).toBeNull();
    expect(safeExternalUrl(null)).toBeNull();
  });
});
