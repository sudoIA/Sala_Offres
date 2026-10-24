import { describe, expect, it } from "vitest";
import { buildMobileDescription, estimateReadingTime, withMobileFields } from "@/lib/legislation-mobile";

describe("buildMobileDescription", () => {
  it("assemble introduction, contenu, FAQ et source", () => {
    const html = buildMobileDescription({
      intro: "Le CDD a une durée limitée.",
      bodyHtml: "<p>Deux ans maximum.</p>",
      faqQuestion: "Et après ?",
      faqAnswer: "Il devient un CDI.",
      sourceUrl: "https://www.sgg.cg/code.pdf",
      sourceLabel: "Code du travail",
    });
    expect(html).toBe(
      "<p><strong>Le CDD a une durée limitée.</strong></p>\n<p>Deux ans maximum.</p>\n" +
        "<p><strong>Et après ?</strong></p>\n<p>Il devient un CDI.</p>\n" +
        '<p>Source : <a href="https://www.sgg.cg/code.pdf">Code du travail</a></p>'
    );
  });

  it("échappe le texte brut et ignore les champs vides", () => {
    expect(buildMobileDescription({ intro: "Salaire < SMIG", bodyHtml: "", faqQuestion: "" })).toBe(
      "<p><strong>Salaire &lt; SMIG</strong></p>"
    );
  });
});

describe("estimateReadingTime", () => {
  it("compte les mots hors balises, au moins 1 minute", () => {
    expect(estimateReadingTime("<p>Bonjour</p>")).toBe("1");
    expect(estimateReadingTime(`<p>${"mot ".repeat(600)}</p>`)).toBe("3");
  });
});

describe("withMobileFields", () => {
  it("ajoute description et readingTime sans toucher au reste", () => {
    const fiche = withMobileFields({ title: "T", topic: "contrat" as const, bodyHtml: "<p>x</p>" });
    expect(fiche).toMatchObject({ title: "T", topic: "contrat", description: "<p>x</p>", readingTime: "1" });
  });
});
