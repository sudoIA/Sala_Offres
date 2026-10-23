import { describe, expect, it } from "vitest";
import { assertPublicHttpUrl, extractCandidateLinks, extractDetail, findFeedUrl, parseFeed } from "@/lib/collectors/generic";

describe("assertPublicHttpUrl", () => {
  it("accepte un site public", () => {
    expect(assertPublicHttpUrl("https://www.exemple.cg/offres").hostname).toBe("www.exemple.cg");
  });

  it("refuse le réseau interne et les protocoles non web", () => {
    for (const url of ["http://localhost:3000", "http://127.0.0.1/", "http://169.254.169.254/latest", "http://10.0.0.5/", "http://192.168.1.1", "file:///etc/passwd", "ftp://exemple.cg", "http://intranet/"]) {
      expect(() => assertPublicHttpUrl(url), url).toThrow();
    }
  });
});

describe("parseFeed", () => {
  it("lit un flux RSS 2.0 (titre, lien, contenu complet)", () => {
    const xml = `<?xml version="1.0"?><rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/"><channel>
      <item><title>Comptable H/F - Brazzaville</title><link>https://exemple.cg/offre-1</link>
      <description>Résumé</description><content:encoded><![CDATA[<p><strong>Missions</strong></p><ul><li>Tenir la caisse</li></ul>]]></content:encoded></item>
      <item><title>Chauffeur</title><link>https://exemple.cg/offre-2</link><description><![CDATA[<p>Permis B</p>]]></description></item>
    </channel></rss>`;
    const items = parseFeed(xml);
    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({ title: "Comptable H/F - Brazzaville", url: "https://exemple.cg/offre-1" });
    expect(items[0].html).toContain("<li>Tenir la caisse</li>");
    expect(items[1].html).toContain("Permis B");
  });

  it("lit un flux Atom", () => {
    const xml = `<feed xmlns="http://www.w3.org/2005/Atom"><entry><title>Stage marketing</title>
      <link rel="alternate" href="https://exemple.cg/stage"/><summary>Stage de 6 mois</summary></entry></feed>`;
    expect(parseFeed(xml)).toEqual([{ title: "Stage marketing", url: "https://exemple.cg/stage", html: "Stage de 6 mois" }]);
  });
});

describe("findFeedUrl", () => {
  it("trouve le flux annoncé, en ignorant celui des commentaires", () => {
    const html = `<head>
      <link rel="alternate" type="application/rss+xml" title="Flux des commentaires" href="/comments/feed/">
      <link rel="alternate" type="application/rss+xml" title="Flux" href="/feed/"></head>`;
    expect(findFeedUrl(html, "https://exemple.cg/emplois/")).toBe("https://exemple.cg/feed/");
  });
});

describe("extractCandidateLinks", () => {
  const html = `<body>
    <nav><a href="/offres/menu-offre-de-navigation">Toutes nos offres d'emploi récentes</a></nav>
    <main>
      <a href="/offre/comptable-senior-brazzaville">Comptable senior (H/F) - Brazzaville</a>
      <a href="/offre/chauffeur-poids-lourd#postuler">Recrutement d'un chauffeur poids lourd</a>
      <a href="/offre/chauffeur-poids-lourd">Recrutement d'un chauffeur poids lourd</a>
      <a href="/category/emploi/">Catégorie Emploi et carrière</a>
      <a href="/a-propos">Qui sommes-nous et notre mission</a>
      <a href="https://autre-site.com/offre/x">Offre sur un autre site web</a>
      <a href="/offre/court">Voir</a>
    </main>
    <footer><a href="/offre/pied-de-page">Offre dans le pied de page du site</a></footer></body>`;

  it("ne garde que les liens d'offres du même site, sans doublon ni menu", () => {
    const links = extractCandidateLinks(html, "https://www.exemple.cg/offres");
    expect(links.map((l) => l.url)).toEqual([
      "https://www.exemple.cg/offre/comptable-senior-brazzaville",
      "https://www.exemple.cg/offre/chauffeur-poids-lourd",
    ]);
  });

  it("avec un sélecteur, prend exactement les liens désignés", () => {
    const links = extractCandidateLinks(`<div class="jobs"><h2><a href="/p/1">Poste 1</a></h2><h2><a href="/p/2">Poste 2</a></h2></div><a href="/p/3">Autre</a>`, "https://exemple.cg/", ".jobs h2");
    expect(links.map((l) => l.title)).toEqual(["Poste 1", "Poste 2"]);
  });
});

describe("extractDetail", () => {
  it("prend le titre et le contenu principal, sans menus ni scripts", () => {
    const html = `<head><title>Site</title><meta property="og:title" content="Assistant RH (H/F)"></head><body>
      <nav>Menu</nav><script>track()</script>
      <div class="entry-content"><p>${"Le poste consiste à gérer les dossiers du personnel. ".repeat(6)}</p></div>
      <footer>Pied</footer></body>`;
    const detail = extractDetail(html);
    expect(detail.title).toBe("Assistant RH (H/F)");
    expect(detail.html).toContain("gérer les dossiers du personnel");
    expect(detail.html).not.toContain("track()");
    expect(detail.html).not.toContain("Menu");
  });
});
