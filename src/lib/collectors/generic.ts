// src/lib/collectors/generic.ts
// Collecteur "générique" pour les sources ajoutées par l'équipe depuis
// Admin > Imports (voir custom-sources.ts), sans code dédié à chaque site.
// Stratégie, de la plus fiable à la moins fiable :
//   1. flux RSS/Atom (fourni directement ou annoncé par la page via
//      <link rel="alternate">) : titre, lien et contenu propres ;
//   2. sinon, détection des liens d'offres sur la page fournie (ou liens
//      désignés par un sélecteur CSS "avancé"), puis lecture de chaque page
//      d'offre (titre + texte principal).
// Entreprise, ville et contrat ne sont pas devinés : l'admin les complète à
// la relecture, ces offres ne sont jamais publiées automatiquement.

import * as cheerio from "cheerio";
import type { ImportedJob } from "@/types/job-import";
import { IMPORT_USER_AGENT, cleanSourceHtml, extractCompanyFromTitle, extractEmail, sleep } from "./shared";

export type GenericMethod = "rss" | "liens" | "selecteur";

export interface GenericCollectResult {
  method: GenericMethod;
  jobs: ImportedJob[];
}

interface Candidate {
  title: string;
  url: string;
  html?: string;
}

const MAX_ITEMS = 15;
const JOB_HINT = /offre|emploi|job|recrut|stage|poste|carri|career|vacan|avis|appel|candidat|opportunit|consultant/i;
const NOT_JOB = /\/(tag|tags|category|categorie|categories|page|author|auteur|login|connexion|register|inscription|contact|about|a-propos|mentions|privacy|confidentialite|cgu|faq|search|recherche|wp-admin|feed)(\/|$)|#|\.(pdf|jpg|jpeg|png|zip|docx?)$/i;

/**
 * Refuse les adresses qui ne sont pas un site public : protocole autre que
 * http(s), localhost, adresses IP privées (le serveur ne doit jamais servir
 * à interroger le réseau interne de l'hébergeur).
 */
export function assertPublicHttpUrl(raw: string): URL {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    throw new Error("Adresse invalide.");
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("Seules les adresses http(s) sont acceptées.");
  const host = url.hostname.toLowerCase();
  const privateIp = /^(127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|0\.)/.test(host) || host === "::1" || host.startsWith("[");
  if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal") || privateIp || !host.includes(".")) {
    throw new Error("Cette adresse n'est pas un site public.");
  }
  return url;
}

async function fetchText(url: string): Promise<{ text: string; contentType: string }> {
  assertPublicHttpUrl(url);
  const res = await fetch(url, {
    headers: { "User-Agent": IMPORT_USER_AGENT, Accept: "text/html,application/xhtml+xml,application/rss+xml,application/xml" },
    cache: "no-store",
    redirect: "follow",
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`Le site a répondu ${res.status} ${res.statusText}`);
  return { text: await res.text(), contentType: res.headers.get("content-type") || "" };
}

function looksLikeFeed(text: string, contentType: string): boolean {
  return /xml|rss|atom/i.test(contentType) || /^\s*(<\?xml[^>]*>\s*)?<(rss|feed)[\s>]/i.test(text);
}

/** Articles d'un flux RSS 2.0 ou Atom. */
export function parseFeed(xml: string): Candidate[] {
  const $ = cheerio.load(xml, { xml: true });
  const items: Candidate[] = [];
  $("item").each((_, el) => {
    const item = $(el);
    const html = item.find("content\\:encoded").first().text() || item.find("description").first().text();
    items.push({ title: item.find("title").first().text().trim(), url: item.find("link").first().text().trim(), html });
  });
  $("entry").each((_, el) => {
    const entry = $(el);
    const link = entry.find('link[rel="alternate"]').attr("href") || entry.find("link").attr("href") || "";
    items.push({
      title: entry.find("title").first().text().trim(),
      url: link.trim(),
      html: entry.find("content").first().text() || entry.find("summary").first().text(),
    });
  });
  return items.filter((i) => i.title && i.url);
}

/** Adresse du flux RSS/Atom annoncé par une page HTML, s'il y en a un. */
export function findFeedUrl(html: string, baseUrl: string): string | null {
  const $ = cheerio.load(html);
  const href = $('link[rel="alternate"][type="application/rss+xml"], link[rel="alternate"][type="application/atom+xml"]')
    .filter((_, el) => !/comment/i.test($(el).attr("title") || "") && !/comments/i.test($(el).attr("href") || ""))
    .first()
    .attr("href");
  return href ? new URL(href, baseUrl).href : null;
}

/**
 * Liens probables vers des offres sur une page de liste : même site, texte
 * de lien de longueur "titre", adresse ou texte évoquant une offre, hors
 * menus/catégories/pagination. Avec un sélecteur, on prend simplement les
 * liens qu'il désigne.
 */
export function extractCandidateLinks(html: string, baseUrl: string, selector?: string): Candidate[] {
  const $ = cheerio.load(html);
  const base = new URL(baseUrl);
  const seen = new Set<string>();
  const out: Candidate[] = [];

  const anchors = selector ? $(selector).find("a").addBack("a") : $("main a, article a, #content a, .content a, body a");
  anchors.each((_, el) => {
    const a = $(el);
    const href = a.attr("href");
    if (!href) return;
    let url: URL;
    try {
      url = new URL(href, base);
    } catch {
      return;
    }
    url.hash = "";
    const title = a.text().replace(/\s+/g, " ").trim() || (a.attr("title") || "").trim();
    if (seen.has(url.href) || !/^https?:$/.test(url.protocol)) return;

    if (!selector) {
      if (url.hostname.replace(/^www\./, "") !== base.hostname.replace(/^www\./, "")) return;
      if (url.pathname === base.pathname || url.pathname.length < 6 || NOT_JOB.test(url.pathname + url.search)) return;
      if (title.length < 12 || title.length > 180) return;
      if (a.closest("nav, header, footer, aside, .menu, .navbar, .breadcrumb, .pagination, .widget").length) return;
      if (!JOB_HINT.test(url.pathname) && !JOB_HINT.test(title)) return;
    } else if (!title) {
      return;
    }

    seen.add(url.href);
    out.push({ title, url: url.href });
  });
  return out;
}

/** Titre et contenu principal d'une page d'offre. */
export function extractDetail(html: string): { title: string; html: string } {
  const $ = cheerio.load(html);
  $("script, style, noscript, nav, header, footer, aside, form, iframe, .share, .sharedaddy, .comments, #comments, .related").remove();
  const title =
    $('meta[property="og:title"]').attr("content")?.trim() || $("h1").first().text().trim() || $("title").first().text().trim();
  const main =
    [".entry-content", ".post-content", ".job-description", ".job_description", "article", "main", "#content", ".content"]
      .map((s) => $(s).first())
      .find((el) => el.length && el.text().trim().length > 200) || $("body");
  return { title: title.replace(/\s+/g, " "), html: main.html() || "" };
}

function stableId(url: string): string {
  // Identifiant stable et court dérivé de l'adresse de l'offre (pas de crypto
  // nécessaire : sert seulement à reconnaître une offre déjà importée).
  let h1 = 0x811c9dc5;
  let h2 = 0;
  for (let i = 0; i < url.length; i++) {
    h1 = Math.imul(h1 ^ url.charCodeAt(i), 16777619) >>> 0;
    h2 = (Math.imul(h2, 31) + url.charCodeAt(i)) >>> 0;
  }
  return h1.toString(36) + h2.toString(36);
}

function toImportedJob(sourceKey: string, c: Candidate, now: string): ImportedJob {
  const description = c.html ? cleanSourceHtml(c.html) : "";
  const text = description.replace(/<[^>]+>/g, " ");
  return {
    title: c.title.slice(0, 200),
    company: extractCompanyFromTitle(c.title),
    description: description || undefined,
    email: extractEmail(text),
    source: sourceKey,
    sourceUrl: c.url,
    sourceId: stableId(c.url),
    status: "pending",
    importedAt: now,
  };
}

/** Collecte une source personnalisée (voir la stratégie en tête de fichier). */
export async function collectGenericSource(
  sourceKey: string,
  config: { url: string; selector?: string; keyword?: string },
  maxItems = MAX_ITEMS
): Promise<GenericCollectResult> {
  const now = new Date().toISOString();
  const keyword = (config.keyword || "").trim().toLowerCase();
  const keep = (c: Candidate) => !keyword || `${c.title} ${c.html || ""}`.toLowerCase().includes(keyword);

  const page = await fetchText(config.url);

  // 1. Flux RSS/Atom, fourni directement ou annoncé par la page.
  let feedXml = looksLikeFeed(page.text, page.contentType) ? page.text : null;
  if (!feedXml && !config.selector) {
    const feedUrl = findFeedUrl(page.text, config.url);
    if (feedUrl) {
      try {
        feedXml = (await fetchText(feedUrl)).text;
      } catch {
        feedXml = null; // flux annoncé mais inaccessible : on passe aux liens
      }
    }
  }
  if (feedXml) {
    const items = parseFeed(feedXml).filter(keep).slice(0, maxItems);
    if (items.length) return { method: "rss", jobs: items.map((c) => toImportedJob(sourceKey, c, now)) };
  }

  // 2. Liens d'offres sur la page, puis lecture de chaque offre.
  const links = extractCandidateLinks(page.text, config.url, config.selector).slice(0, maxItems * 2);
  const jobs: ImportedJob[] = [];
  for (const link of links) {
    if (jobs.length >= maxItems) break;
    try {
      const detail = extractDetail((await fetchText(link.url)).text);
      const candidate = { title: detail.title || link.title, url: link.url, html: detail.html };
      if (keep(candidate)) jobs.push(toImportedJob(sourceKey, candidate, now));
    } catch (err) {
      console.warn(`Offre illisible (${link.url}) :`, err);
    }
    await sleep(300); // rester poli avec le site source
  }
  return { method: config.selector ? "selecteur" : "liens", jobs };
}
