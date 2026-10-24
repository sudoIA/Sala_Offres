// src/lib/api/serializers.ts
// Mise en forme des documents Firestore pour l'API publique /api/v1 : mêmes
// règles que le site (offres expirées ou masquées exclues, descriptions
// mises en forme et assainies), noms de champs stables et documentés dans
// docs/api-v1.md. Fonctions pures : les images (recherche dans Storage)
// sont résolues à part, dans les routes.

import { formatJobBody } from "@/lib/job-body";
import { RICH_TEXT, sanitizeHtmlServer } from "@/lib/server-sanitize";
import { safeExternalUrl } from "@/lib/safe-url";
import { ALERT_CONTRACTS } from "@/lib/job-alerts";
import { eventCardSummary, eventContactLinks, isEventCurrent, type EventContactLink } from "@/lib/event-helpers";
import {
  annuaireAddress,
  annuaireBadgeLabel,
  annuaireCardSummary,
  annuaireDescription,
  annuaireDetailChips,
  annuaireDirectionsUrl,
  annuaireEmails,
  annuaireFullName,
  annuaireHours,
  annuairePhones,
  annuaireWebsite,
} from "@/lib/annuaire-helpers";
import type { AnnuaireCategory, AnnuaireItem } from "@/types/annuaire";
import type { PlainDoc } from "@/lib/api/server-data";

const str = (v: unknown): string => (typeof v === "string" ? v.trim() : "");
const strOrNull = (v: unknown): string | null => str(v) || null;
const date = (v: unknown): string | null => (typeof v === "string" && !Number.isNaN(Date.parse(v)) ? v : null);

export function plainText(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

/** Minuscules sans accents, pour la recherche et les filtres. */
export function searchable(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function sanitize(html: string): string {
  return sanitizeHtmlServer(html, RICH_TEXT);
}

/** Lien vers la page correspondante du site. */
function pageUrl(siteUrl: string, path: string): string {
  return `${siteUrl.replace(/\/$/, "")}${path}`;
}

// --- Offres d'emploi ---

export interface ApiJob {
  id: string;
  title: string;
  company: string;
  city: string;
  contract: string;
  description: string;
  descriptionText: string;
  email: string | null;
  tel: string | null;
  site: string | null;
  languages: string | null;
  competences: string[];
  /** Fiche de l'annuaire des entreprises reliée à l'offre (voir company-links.ts), ou null. */
  companyId: string | null;
  logo: string | null;
  publishedAt: string | null;
  deadline: string | null;
  url: string;
}

/** Offre visible sur le site : non masquée et date limite non dépassée. */
export function isJobActive(d: PlainDoc, now = new Date()): boolean {
  const deadline = date(d.deadline);
  return d.visibility !== false && (!deadline || new Date(deadline) > now);
}

export function toApiJob(d: PlainDoc, siteUrl: string): ApiJob {
  const description = sanitize(formatJobBody(str(d.body)));
  return {
    id: d.id,
    title: str(d.title) || "Offre d'emploi",
    company: str(d.company),
    city: str(d.city),
    contract: str(d.contract),
    description,
    descriptionText: plainText(description),
    email: strOrNull(d.email),
    tel: strOrNull(d.tel),
    site: safeExternalUrl(str(d.site)),
    languages: strOrNull(d.languages),
    competences: Array.isArray(d.competences) ? d.competences.filter((c): c is string => typeof c === "string") : [],
    companyId: null,
    logo: null,
    publishedAt: date(d.timestamp),
    deadline: date(d.deadline),
    url: pageUrl(siteUrl, `/offres/${d.id}`),
  };
}

export interface JobFilters {
  q?: string;
  ville?: string;
  contrat?: string;
}

/** Filtres de la liste des offres (insensibles à la casse et aux accents). */
export function matchesJobFilters(job: ApiJob, { q, ville, contrat }: JobFilters): boolean {
  if (ville && !searchable(job.city).includes(searchable(ville))) return false;
  if (contrat) {
    // "CDI" retrouve aussi "Contrat à durée indéterminée" (mêmes formulations que les alertes e-mail).
    const known = ALERT_CONTRACTS.find((c) => searchable(c.value) === searchable(contrat));
    if (known ? !known.pattern.test(`${job.contract} ${job.title}`) : searchable(job.contract) !== searchable(contrat)) return false;
  }
  if (q) {
    const haystack = searchable(`${job.title} ${job.company} ${job.city} ${job.contract} ${job.descriptionText}`);
    if (!searchable(q).split(/\s+/).filter(Boolean).every((word) => haystack.includes(word))) return false;
  }
  return true;
}

// --- Événements ---

export interface ApiEvent {
  id: string;
  title: string;
  summary: string;
  description: string;
  host: string;
  city: string;
  place: string | null;
  tel: string | null;
  email: string | null;
  site: string | null;
  contactLinks: EventContactLink[];
  image: string | null;
  start: string | null;
  end: string | null;
  url: string;
}

export function isEventVisible(d: PlainDoc, now = new Date()): boolean {
  const start = date(d.deadline);
  const end = date(d.deadline2);
  return (
    d.visibility !== false &&
    isEventCurrent({ deadlineDate: start ? new Date(start) : null, deadline2Date: end ? new Date(end) : null }, now)
  );
}

export function toApiEvent(d: PlainDoc, siteUrl: string): ApiEvent {
  const body = str(d.body);
  return {
    id: d.id,
    title: str(d.title) || "Événement",
    summary: eventCardSummary({ resume: str(d.resume), body }),
    description: sanitize(body),
    host: str(d.host),
    city: str(d.city),
    place: strOrNull(d.place),
    tel: strOrNull(d.tel),
    email: strOrNull(d.email),
    site: safeExternalUrl(str(d.site)),
    contactLinks: eventContactLinks({ site: str(d.site), tel: str(d.tel), email: str(d.email) }),
    image: null,
    start: date(d.deadline),
    end: date(d.deadline2),
    url: pageUrl(siteUrl, "/evenements"),
  };
}

// --- Droit du travail ---

export interface ApiFiche {
  id: string;
  order: number;
  topic: string;
  topicLabel: string;
  articleRef: string;
  title: string;
  intro: string;
  bodyHtml: string;
  faqQuestion: string | null;
  faqAnswer: string | null;
  sourceUrl: string | null;
  sourceLabel: string | null;
  description: string;
  readingTime: string;
}

export function toApiFiche(d: PlainDoc): ApiFiche {
  return {
    id: d.id,
    order: typeof d.order === "number" ? d.order : 0,
    topic: str(d.topic),
    topicLabel: str(d.topicLabel),
    articleRef: str(d.articleRef),
    title: str(d.title),
    intro: str(d.intro),
    bodyHtml: sanitize(str(d.bodyHtml)),
    faqQuestion: strOrNull(d.faqQuestion),
    faqAnswer: strOrNull(d.faqAnswer),
    sourceUrl: safeExternalUrl(str(d.sourceUrl)),
    sourceLabel: strOrNull(d.sourceLabel),
    description: sanitize(str(d.description)),
    readingTime: str(d.readingTime) || "1",
  };
}

// --- Quiz ---

export interface ApiQuizQuestion {
  id: string;
  theme: string;
  order: number;
  question: string;
  options: { text: string; correct: boolean; explanation: string }[];
}

export function toApiQuiz(d: PlainDoc): ApiQuizQuestion {
  const options = Array.isArray(d.options) ? (d.options as Record<string, unknown>[]) : [];
  return {
    id: d.id,
    theme: str(d.theme),
    order: typeof d.order === "number" ? d.order : 0,
    question: str(d.question),
    options: options.map((o) => ({ text: str(o.text), correct: o.correct === true, explanation: str(o.explanation) })),
  };
}

// --- News Sala ---

export interface ApiNews {
  id: string;
  title: string;
  summary: string;
  body: string;
  image: string | null;
  publishedAt: string | null;
  url: string;
}

export function toApiNews(d: PlainDoc, siteUrl: string): ApiNews {
  return {
    id: d.id,
    title: str(d.title),
    summary: str(d.summary),
    body: sanitize(formatJobBody(str(d.body))),
    image: safeExternalUrl(str(d.image)),
    publishedAt: date(d.publishedAt),
    url: pageUrl(siteUrl, "/actualites"),
  };
}

// --- Annuaires ---

export const API_ANNUAIRE_CATEGORIES: Record<string, AnnuaireCategory> = {
  universites: "universities",
  entreprises: "companies",
  clubs: "clubs",
};

export interface ApiAnnuaireItem {
  id: string;
  category: string;
  name: string;
  fullName: string;
  type: string;
  city: string;
  district: string | null;
  address: string | null;
  hours: string | null;
  summary: string;
  description: string;
  phones: string[];
  emails: string[];
  website: string | null;
  /** Entreprises : autres noms sous lesquels elle publie ses offres. */
  aliases: string[];
  tags: { label: string; items: string[] };
  directionsUrl: string | null;
  logo: string | null;
  photo: string | null;
  verified: boolean;
}

export function toApiAnnuaire(d: PlainDoc, categoryKey: string): ApiAnnuaireItem {
  const category = API_ANNUAIRE_CATEGORIES[categoryKey];
  const item = d as unknown as AnnuaireItem;
  return {
    id: d.id,
    category: categoryKey,
    name: str(item.name) || annuaireFullName(item),
    fullName: annuaireFullName(item),
    type: annuaireBadgeLabel(category, item),
    city: str(item.city),
    district: strOrNull(item.district),
    address: annuaireAddress(item) || null,
    hours: annuaireHours(item) || null,
    summary: annuaireCardSummary(item),
    description: annuaireDescription(item),
    phones: annuairePhones(item),
    emails: annuaireEmails(item),
    website: annuaireWebsite(item) || null,
    aliases: Array.isArray(item.aliases) ? item.aliases.filter((a): a is string => typeof a === "string") : [],
    tags: annuaireDetailChips(category, item),
    directionsUrl: annuaireDirectionsUrl(item),
    logo: null,
    photo: null,
    verified: item.verified === true,
  };
}
