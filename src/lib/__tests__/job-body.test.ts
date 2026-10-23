import { describe, expect, it } from "vitest";
import { formatJobBody } from "@/lib/job-body";

// Extrait réel (ACPE) tel qu'il était stocké avant la conservation du HTML.
const GLUED =
  "Electricien Industriel (H/F)Entreprise: KAC CONGOLieu: Pointe-NoireType de contrat : CDDDescription du poste:" +
  "Assurer l'installation et la maintenance des équipements.Missions principales :Installer et raccorder les " +
  "équipements électriques industrielsRéaliser les opérations de maintenance préventive et correctiveDiagnostiquer " +
  "les pannesProfil recherché :Bac+2 en électricité ;Maîtrise de PowerPoint ;Rigueur et sens de l'organisation" +
  "Comment postuler ?Connectez-vous à votre compte ACPE.";

describe("formatJobBody", () => {
  it("met chaque rubrique courte sur sa propre ligne, libellé en gras", () => {
    const html = formatJobBody(GLUED);
    expect(html).toContain("<strong>Entreprise :</strong> KAC CONGO<br>");
    expect(html).toContain("<strong>Lieu :</strong> Pointe-Noire<br>");
    expect(html).toContain("<strong>Type de contrat :</strong> CDD");
  });

  it("transforme les missions collées en liste à puces", () => {
    const html = formatJobBody(GLUED);
    expect(html).toContain("<li>Installer et raccorder les équipements électriques industriels</li>");
    expect(html).toContain("<li>Réaliser les opérations de maintenance préventive et corrective</li>");
    expect(html).toContain("<li>Diagnostiquer les pannes</li>");
  });

  it("ne coupe pas les mots à majuscule interne (PowerPoint)", () => {
    expect(formatJobBody(GLUED)).toContain("<li>Maîtrise de PowerPoint</li>");
  });

  it("garde l'intitulé de tête en gras et ajoute les titres de sections", () => {
    const html = formatJobBody(GLUED);
    expect(html.startsWith("<p><strong>Electricien Industriel (H/F)</strong></p>")).toBe(true);
    expect(html).toContain('<p class="sala-job-body-heading"><strong>Comment postuler ?</strong></p>');
  });

  it("laisse intact un corps déjà en HTML (offres saisies à la main)", () => {
    const manual = "OFFRE D'EMPLOI <br><br><b>Missions</b><br>- Gérer le stock";
    expect(formatJobBody(manual)).toBe(manual);
  });

  it("échappe le texte brut (pas d'injection de balise)", () => {
    const html = formatJobBody("Lieu : Brazzaville <img src=x onerror=alert(1)>");
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;img");
  });

  it("renvoie une chaîne vide pour un corps vide", () => {
    expect(formatJobBody("   ")).toBe("");
  });
});
