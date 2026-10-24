import { describe, expect, it } from "vitest";
import { RICH_TEXT, sanitizeHtmlServer } from "@/lib/server-sanitize";

const clean = (html: string) => sanitizeHtmlServer(html, RICH_TEXT);

describe("sanitizeHtmlServer", () => {
  it("garde la mise en forme autorisée", () => {
    expect(clean("<p>Lieu : <strong>Brazzaville</strong></p><ul><li>Un</li></ul>")).toBe(
      "<p>Lieu : <strong>Brazzaville</strong></p><ul><li>Un</li></ul>"
    );
  });

  it("supprime scripts, styles et iframes avec leur contenu", () => {
    expect(clean('<p>ok</p><script>alert(1)</script><style>p{}</style><iframe src="x"></iframe>')).toBe("<p>ok</p>");
  });

  it("retire les attributs dangereux", () => {
    expect(clean('<p onclick="alert(1)" style="color:red">x</p><img src=x onerror=alert(1)>')).toBe("<p>x</p>");
  });

  it("neutralise les liens javascript:", () => {
    expect(clean('<a href="javascript:alert(1)">a</a><a href="https://ongsala.com">b</a>')).toBe(
      '<a>a</a><a href="https://ongsala.com/">b</a>'
    );
  });

  it("déballe les balises inconnues sans perdre le texte", () => {
    expect(clean("<section><font>Texte</font></section>")).toBe("Texte");
  });

  it("supprime les commentaires", () => {
    expect(clean("<p>a<!-- <script>x</script> --></p>")).toBe("<p>a</p>");
  });
});
