// src/lib/collectors/afriqueemplois.ts
// Collecteur pour https://afriqueemplois.com/cg (offres Congo-Brazzaville).
// Site classique rendu côté serveur : une simple requête + parsing HTML
// (cheerio) suffit.
//
// Important : le site propose un bouton "Charger plus" qui appelle
// https://afriqueemplois.com/api/load-more — cette route est explicitement
// interdite par leur robots.txt (`Disallow: /api/`), donc on ne l'utilise
// jamais. La pagination normale `?page=N` (une vraie page HTML, pas l'API)
// n'est elle pas bloquée et renvoie bien un lot différent d'offres à chaque
// page (vérifié le 2026-09-12).
//
// Sélecteurs vérifiés le 2026-09-12 en inspectant le HTML réel de la page :
//   #posts-container article.card-hover  -> un encart par offre
//   a[href*="/cg/post/"]                 -> lien réel vers l'offre, id numérique en suffixe
//   h3                                   -> intitulé du poste (toujours fiable)
//   img                                  -> logo (souvent l'image par défaut "default_emplois.webp" = pas de vrai logo)
//   p.text-gray-600 (résumé)             -> le contenu varie énormément d'une annonce à l'autre (voir ci-dessous).
//
// Deux formats coexistent dans ce résumé, sans qu'on puisse choisir lequel à
// l'avance :
//  1. Un format "annonce rapide" propre : "Entreprise : X Lieu : Y Type de
//     contrat : Z [Salaire : W] Date limite : JJ/MM/AAAA" puis la description,
//     tout concaténé sans séparateur. -> SUMMARY_RE ci-dessous l'extrait
//     entièrement d'un coup.
//  2. Des annonces plus longues, rédigées librement (souvent republiées
//     depuis des organisations comme l'ONU, l'UE, des ONG ou de grandes
//     entreprises), qui n'ont pas cette structure fixe. Dans ce cas on tente
//     une extraction "au mieux" champ par champ (voir extractLabeled) et on
//     laisse vide tout ce qu'on ne peut pas identifier avec confiance :
//     mieux vaut un champ vide que rempli au hasard, l'admin le complète
//     dans l'écran de relecture avant publication.

import * as cheerio from "cheerio";
import type { ImportedJob } from "@/types/job-import";
import { IMPORT_USER_AGENT, extractCompanyFromTitle, extractEmail, parseFrDate } from "./shared";

const SOURCE = "afriqueemplois";
const LIST_URL = "https://afriqueemplois.com/cg";

const SUMMARY_RE =
  /Entreprise\s*:\s*(.*?)Lieu\s*:\s*(.*?)Type de contrat\s*:\s*(.*?)(?:Salaire\s*:\s*(.*?))?Date limite\s*:\s*(\d{2}\/\d{2}\/\d{4})([\s\S]*)$/;

// Toutes les étiquettes vues dans les annonces "texte libre" — utilisées
// uniquement comme frontières pour ne pas laisser un champ avaler le texte
// suivant, même celles qu'on n'extrait pas nous-mêmes (ex. "Durée du
// contrat" : une durée n'est pas un type de contrat, on ne la récupère pas,
// mais il faut savoir que la ville/ l'entreprise s'arrêtent avant elle).
const KNOWN_LABELS = [
  "Entreprise",
  "Société",
  "Lieux? de travail",
  "Lieu",
  "Type de contrat",
  "Durée du contrat",
  "Durée",
  "Salaire",
  "Date limite",
  "Date de cl[ôo]ture",
  "Date de publication",
  "Identification du poste",
  "Poste",
];
const LABEL_STOP = `(?=${KNOWN_LABELS.join("|")}\\s*:|$)`;

/** Extrait la valeur qui suit une étiquette ("Lieu :", "Entreprise :"...),
 * bornée par la prochaine étiquette connue. Renvoie undefined plutôt qu'une
 * valeur suspecte (introuvable, ou anormalement longue signe qu'aucune
 * frontière n'a été trouvée) : on ne veut jamais deviner. */
function extractLabeled(text: string, label: string): string | undefined {
  const re = new RegExp(`${label}\\s*:\\s*(.*?)${LABEL_STOP}`, "i");
  const match = text.match(re);
  const value = match?.[1]?.trim().replace(/^[-:.,\s]+|[-:.,\s]+$/g, "");
  if (!value || value.length > 80) return undefined;
  return value;
}

function firstLabeled(text: string, labels: string[]): string | undefined {
  for (const label of labels) {
    const value = extractLabeled(text, label);
    if (value) return value;
  }
  return undefined;
}

/** Cherche une date à côté d'une étiquette d'échéance ("Date limite",
 * "Date de clôture") n'importe où dans le texte, sans capturer ce qui suit. */
function extractDeadline(text: string): string | undefined {
  const match = text.match(/(?:Date limite|Date de cl[ôo]ture|Cl[ôo]ture)\s*:?\s*(\d{2})[/-](\d{2})[/-](\d{4})/i);
  if (!match) return undefined;
  const [, day, month, year] = match;
  return `${year}-${month}-${day}`;
}

export interface CollectAfriqueemploisResult {
  page: number;
  jobs: ImportedJob[];
}

export async function collectAfriqueemploisPage(page = 1): Promise<CollectAfriqueemploisResult> {
  const url = page > 1 ? `${LIST_URL}?page=${page}` : LIST_URL;
  const res = await fetch(url, {
    headers: { "User-Agent": IMPORT_USER_AGENT, Accept: "text/html" },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Afriqueemplois a répondu ${res.status} ${res.statusText} pour ${url}`);
  }
  const html = await res.text();
  const $ = cheerio.load(html);

  const jobs: ImportedJob[] = [];
  const now = new Date().toISOString();

  $("#posts-container article.card-hover").each((_, el) => {
    const card = $(el);

    const href = card.find('a[href*="/cg/post/"]').first().attr("href") || "";
    const idMatch = href.match(/\/post\/(\d+)/);
    if (!idMatch) return; // Pas de lien exploitable : on ignore cet encart plutôt que d'inventer un id.
    const sourceId = idMatch[1];

    const title = card.find("h3").first().text().trim();
    if (!title) return;

    const summaryText = card.find("p.text-gray-600").first().text().replace(/\s+/g, " ").trim();
    const strict = summaryText.match(SUMMARY_RE);

    let company: string | undefined;
    let city: string | undefined;
    let contract: string | undefined;
    let salary: string | undefined;
    let deadline: string | undefined;
    let description: string | undefined;

    if (strict) {
      // Format "annonce rapide" : tous les champs sont fiables d'un coup.
      const [, strictCompany, strictCity, strictContract, strictSalary, strictDeadline, strictDescription] = strict;
      company = strictCompany.trim();
      city = strictCity.trim();
      contract = strictContract.trim();
      salary = strictSalary ? strictSalary.trim() : undefined;
      deadline = parseFrDate(strictDeadline);
      description = strictDescription.trim() || undefined;
    } else {
      // Annonce en texte libre : on récupère ce qu'on peut identifier avec
      // confiance, on laisse le reste vide plutôt que de deviner. La
      // description complète (le résumé n'est jamais tronqué dans le HTML,
      // seulement à l'affichage) reste disponible dans tous les cas.
      company = firstLabeled(summaryText, ["Entreprise", "Société"]) || extractCompanyFromTitle(title);
      city = firstLabeled(summaryText, ["Lieux? de travail", "Lieu"]);
      contract = firstLabeled(summaryText, ["Type de contrat"]);
      salary = firstLabeled(summaryText, ["Salaire"]);
      deadline = extractDeadline(summaryText);
      description = summaryText || undefined;
    }

    let logo = card.find("img").first().attr("src") || undefined;
    if (logo && /default_emplois/i.test(logo)) logo = undefined; // logo générique = pas de vrai logo

    jobs.push({
      title,
      company,
      city,
      contract,
      salary,
      description,
      email: extractEmail(summaryText),
      deadline,
      logo,
      source: SOURCE,
      sourceUrl: href.startsWith("http") ? href : `https://afriqueemplois.com${href}`,
      sourceId,
      status: "pending",
      importedAt: now,
    });
  });

  return { page, jobs };
}
