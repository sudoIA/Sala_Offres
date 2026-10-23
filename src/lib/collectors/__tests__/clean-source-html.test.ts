import { describe, expect, it } from "vitest";
import { cleanSourceHtml } from "@/lib/collectors/shared";

describe("cleanSourceHtml", () => {
  it("garde paragraphes, gras et listes de la page source", () => {
    const html =
      '<p><strong>Lieu :</strong> Brazzaville<br><strong>Durée :</strong> CDI<br>&nbsp;</p>' +
      "<p><strong>Missions principales :</strong></p><ul><li>Gérer l'agenda.&nbsp;</li><li>Filtrer les appels.</li></ul>";
    expect(cleanSourceHtml(html)).toBe(
      "<p><strong>Lieu :</strong> Brazzaville<br><strong>Durée :</strong> CDI</p>" +
        "<p><strong>Missions principales :</strong></p><ul><li>Gérer l'agenda.</li><li>Filtrer les appels.</li></ul>"
    );
  });

  it("retire scripts, liens, images, styles et attributs", () => {
    const html =
      '<p class="x" style="color:red" onclick="steal()">Texte <a href="https://pub.example">lien</a></p>' +
      '<script>alert(1)</script><img src="x" onerror="alert(1)"><iframe src="https://evil"></iframe>';
    const clean = cleanSourceHtml(html);
    expect(clean).toBe("<p>Texte lien</p>");
  });

  it("supprime les paragraphes vides", () => {
    expect(cleanSourceHtml("<p> </p><p>Contenu</p><p>&nbsp;</p>")).toBe("<p>Contenu</p>");
  });
});
