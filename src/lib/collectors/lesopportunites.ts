// src/lib/collectors/lesopportunites.ts
// Collecteur pour https://www.lesopportunites.com/opportunite/republique-du-congo/
// ("Opportunités du Monde") : un site qui republie des offres d'emploi
// d'organisations internationales (ONU, ONG, entreprises) classées par pays,
// spécifiquement pour la République du Congo. WordPress classique rendu côté
// serveur, aucune restriction dans leur robots.txt (vérifié le 2026-09-12).
//
// Sélecteurs vérifiés le 2026-09-12 en inspectant le HTML réel :
// Page liste (un item par bloc ".banner.row") :
//   .col-md-4 a[href*="/type/"]     -> catégorie de l'annonce ; on ne garde que
//                                       "avis-de-recrutement" et "stages", on
//                                       ignore "volontaires" (bénévolat) et
//                                       "bourses" (études), hors périmètre de Sala.
//   h3.title a / h2.title a         -> intitulé + lien réel vers la page détail
// Page détail :
//   .post-content                   -> texte intégral de l'annonce (contenu
//                                       éditorial riche, jamais de champs fixes
//                                       communs à toutes les annonces — d'où
//                                       l'extraction "au mieux" ci-dessous).
//
// Beaucoup de titres suivent "Entreprise recrute un(e) Poste" (même patron que
// sur Afriqueemplois.com) : fiable pour l'entreprise. Ville, contrat et date
// limite ne sont eux jamais présentés de façon assez uniforme d'une annonce à
// l'autre pour être extraits sans risque de se tromper : on les laisse vides,
// l'admin les complète dans l'écran de relecture avant publication.

import * as cheerio from "cheerio";
import type { ImportedJob } from "@/types/job-import";
import { IMPORT_USER_AGENT, extractCompanyFromTitle, extractEmail, sleep } from "./shared";

const SOURCE = "lesopportunites";
// La pagination de "/opportunite/republique-du-congo/page/2/" renvoie un 404
// (bug côté leur site, vérifié le 2026-09-12) ; "/pays/republique-du-congo/"
// est un alias qui liste le même contenu et dont la pagination fonctionne.
const BASE_URL = "https://www.lesopportunites.com/pays/republique-du-congo";

interface ListItem {
  title: string;
  href: string;
}

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": IMPORT_USER_AGENT, Accept: "text/html" },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Les Opportunités a répondu ${res.status} ${res.statusText} pour ${url}`);
  }
  return res.text();
}

function listUrl(page: number): string {
  return page > 1 ? `${BASE_URL}/page/${page}/` : `${BASE_URL}/`;
}

async function fetchDetail(item: ListItem, now: string): Promise<ImportedJob | null> {
  try {
    const html = await fetchHtml(item.href);
    const $ = cheerio.load(html);
    const description = $(".post-content").first().text().replace(/\s+/g, " ").trim() || undefined;

    const slugMatch = item.href.match(/\/([^/]+)\/?$/);
    const sourceId = slugMatch ? slugMatch[1] : item.href;

    return {
      title: item.title,
      company: extractCompanyFromTitle(item.title),
      description,
      email: description ? extractEmail(description) : undefined,
      source: SOURCE,
      sourceUrl: item.href,
      sourceId,
      status: "pending",
      importedAt: now,
    };
  } catch (err) {
    console.warn(`Détail Les Opportunités impossible pour ${item.href} :`, err);
    return null;
  }
}

export interface CollectLesOpportunitesResult {
  page: number;
  jobs: ImportedJob[];
}

export async function collectLesOpportunitesPage(page = 1): Promise<CollectLesOpportunitesResult> {
  const html = await fetchHtml(listUrl(page));
  const $ = cheerio.load(html);

  const items: ListItem[] = [];
  $(".banner.row").each((_, el) => {
    const card = $(el);
    const typeHref = card.find('.col-md-4 a[href*="/type/"]').first().attr("href") || "";
    // On ne garde que les vraies offres d'emploi et de stage — on ignore le
    // bénévolat ("volontaires"), les bourses d'études et les autres types.
    if (!/\/type\/(avis-de-recrutement|stages)\//.test(typeHref)) return;

    const link = card.find("h3.title a, h2.title a").first();
    const title = link.text().trim();
    const href = link.attr("href") || "";
    if (title && href) items.push({ title, href });
  });

  const jobs: ImportedJob[] = [];
  const now = new Date().toISOString();
  for (const item of items) {
    const job = await fetchDetail(item, now);
    if (job) jobs.push(job);
    await sleep(300); // reste poli avec leur serveur : une page détail par offre listée
  }

  return { page, jobs };
}
