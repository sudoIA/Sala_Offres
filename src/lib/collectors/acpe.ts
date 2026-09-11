// src/lib/collectors/acpe.ts
// Collecteur pour https://acpe.cg/public/offres-emplois (Agence Congolaise
// pour l'Emploi). Site Laravel/Livewire rendu côté serveur (pas de SPA), donc
// une simple requête + parsing HTML (cheerio) suffit, pas de navigateur headless.
//
// Sélecteurs vérifiés le 2026-09-11 en inspectant le HTML réel de la page
// liste et d'une page détail (voir les deux blocs ci-dessous) — à revalider
// si l'ACPE change son thème, ce genre de site pouvant changer sans préavis.
//
// Page liste, un encart par offre (classe "job-card") :
//   .image-box img[src]                 -> logo entreprise (peut être un "blank.png" générique)
//   .company-info h5.mb-0 a.name-job    -> nom entreprise (le href pointe vers une page statique factice, à ignorer)
//   .company-info small                 -> ville affichée à côté du nom
//   ul.job-list li.job-cats (position)  -> [0]=ville (doublon), [1]=type de contrat, [2]=salaire
//   .job-block-info h4.mb-1 a           -> intitulé du poste (le href est lui aussi factice)
//   .job-price                          -> date limite, format "JJ-MM-AAAA"
//   a.job-btn[href*="details-offre-emplois/"] -> SEUL lien réel vers l'offre, id numérique en suffixe
//
// Pagination Laravel standard : ?page=2, ?page=3, ... (~12 offres/page, ~295
// pages au total au moment de l'inspection).

import * as cheerio from "cheerio";
import type { ImportedJob } from "@/types/job-import";

const SOURCE = "acpe";
const LIST_URL = "https://acpe.cg/public/offres-emplois";
const USER_AGENT = "Mozilla/5.0 (compatible; SalaBot/1.0; +https://www.ongsala.com)";

/** Convertit "JJ-MM-AAAA" ou "JJ/MM/AAAA" en "AAAA-MM-JJ" (ISO). */
function parseAcpeDate(text: string | undefined | null): string | undefined {
  if (!text) return undefined;
  const match = text.trim().match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/);
  if (!match) return undefined;
  const [, day, month, year] = match;
  return `${year}-${month}-${day}`;
}

/** Extrait l'identifiant numérique final d'une URL de détail ACPE. */
function extractSourceId(detailUrl: string): string | null {
  const match = detailUrl.match(/details-offre-emplois\/(\d+)/);
  return match ? match[1] : null;
}

/**
 * Complète une offre (issue de collectAcpePage) avec les infos qui n'existent
 * que sur sa page détail : description complète, email de contact et
 * intitulé de contrat en toutes lettres. Sélecteurs vérifiés le 2026-09-11
 * sur https://acpe.cg/public/details-offre-emplois/4452 :
 *   .badge.bg-primary                              -> type de contrat en toutes lettres
 *   carte "Description du poste" -> .card-body      -> texte complet de l'offre
 *   carte "L'entreprise" -> .card-body               -> contient un e-mail de contact
 * Best-effort : si la page détail échoue ou change de forme, on renvoie
 * l'offre de base inchangée plutôt que de faire échouer tout l'import.
 */
export async function enrichAcpeJob(job: ImportedJob): Promise<ImportedJob> {
  try {
    const res = await fetch(job.sourceUrl, {
      headers: { "User-Agent": USER_AGENT, Accept: "text/html" },
      cache: "no-store",
    });
    if (!res.ok) return job;
    const html = await res.text();
    const $ = cheerio.load(html);

    const cardBodyAfter = (headerContains: string) =>
      $(".card-header")
        .filter((_, el) => $(el).text().includes(headerContains))
        .first()
        .next(".card-body");

    const contractFull = $(".badge.bg-primary").first().text().trim();
    const description = cardBodyAfter("Description du poste").text().replace(/\s+/g, " ").trim();
    const companyText = cardBodyAfter("entreprise").text();
    const emailMatch = companyText.match(/[\w.+-]+@[\w-]+\.[\w.-]+/);

    return {
      ...job,
      contract: contractFull || job.contract,
      description: description || undefined,
      email: emailMatch ? emailMatch[0] : undefined,
    };
  } catch (err) {
    console.warn(`Enrichissement ACPE impossible pour ${job.sourceUrl} :`, err);
    return job;
  }
}

export interface CollectAcpeResult {
  page: number;
  totalOffersLabel: string | null;
  jobs: ImportedJob[];
}

/** Récupère et parse une page de la liste d'offres ACPE (pas d'écriture Firestore ici). */
export async function collectAcpePage(page = 1): Promise<CollectAcpeResult> {
  const url = page > 1 ? `${LIST_URL}?page=${page}` : LIST_URL;
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "text/html" },
    // Le site est mis à jour en continu ; on ne veut jamais d'une réponse mise en cache par Next.
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`ACPE a répondu ${res.status} ${res.statusText} pour ${url}`);
  }
  const html = await res.text();
  const $ = cheerio.load(html);

  const totalOffersLabel = $(".list-results-sort p").first().text().trim().replace(/\s+/g, " ") || null;

  const jobs: ImportedJob[] = [];
  const now = new Date().toISOString();

  $(".job-card").each((_, el) => {
    const card = $(el);

    const detailHref = card.find('a.job-btn[href*="details-offre-emplois/"]').attr("href") || "";
    const sourceId = extractSourceId(detailHref);
    if (!sourceId) return; // Pas de lien exploitable : on ignore cet encart plutôt que d'inventer un id.

    const title = card.find(".job-block-info h4.mb-1 a").first().text().trim();
    const company = card.find(".company-info a.name-job").first().text().trim();
    const city = card.find(".company-info small").first().text().trim();

    const tags = card
      .find("ul.job-list li.job-cats")
      .map((__, li) => $(li).text().trim())
      .get();
    const contract = tags[1] || "";
    const salary = tags[2] || undefined;

    const deadlineRaw = card.find(".job-price").first().text().trim();
    const deadline = parseAcpeDate(deadlineRaw);

    let logo = card.find(".image-box img").first().attr("src") || undefined;
    if (logo && /blank\.(png|jpg)$/i.test(logo)) logo = undefined; // logo générique = pas de vrai logo

    if (!title || !company) return; // Encart incomplet, probablement une erreur de rendu côté ACPE.

    jobs.push({
      title,
      company,
      city,
      contract,
      salary,
      deadline,
      logo,
      source: SOURCE,
      sourceUrl: detailHref,
      sourceId,
      status: "pending",
      importedAt: now,
    });
  });

  return { page, totalOffersLabel, jobs };
}
