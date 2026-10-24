// src/lib/event-helpers.ts
// Tri des événements par date de début (deadlineDate), les événements sans
// date exploitable étant affichés en dernier plutôt qu'exclus.

import { findStorageFileUrl } from "@/lib/storage-lookup";
import { safeExternalUrl } from "@/lib/safe-url";
import type { EventDoc, SalaEvent } from "@/types/event";

/**
 * Résout le champ "image" d'un événement en URL publique affichable.
 * Accepte une URL déjà complète, ou un mot-clé à retrouver parmi les
 * fichiers du dossier Storage "events/" (voir findStorageFileUrl).
 */
export async function resolveEventImageUrl(image?: string | null): Promise<string | null> {
  const trimmed = (image || "").trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return findStorageFileUrl("events", trimmed);
}

/**
 * Un événement reste affiché jusqu'à sa date de fin (deadline2), ou sa date
 * de début (deadline) s'il n'a pas de fin. Filtrer sur la seule date de début
 * masquait les événements en cours (ex. un concours ouvert du 10/09 au 25/10),
 * alors que l'app mobile les affiche.
 */
export function isEventCurrent(evt: Pick<SalaEvent, "deadlineDate" | "deadline2Date">, now = new Date()): boolean {
  const end = evt.deadline2Date || evt.deadlineDate;
  return !end || end > now;
}

export function sortEventsByDate(events: SalaEvent[]): SalaEvent[] {
  return [...events].sort((a, b) => {
    const ta = a.deadlineDate ? a.deadlineDate.getTime() : Number.MAX_SAFE_INTEGER;
    const tb = b.deadlineDate ? b.deadlineDate.getTime() : Number.MAX_SAFE_INTEGER;
    return ta - tb;
  });
}

/**
 * Résumé à afficher sur la carte de la liste : le champ "resume" s'il a été
 * renseigné, sinon un repli en texte brut (balises HTML retirées) tronqué
 * proprement — jamais le HTML de "body" coupé à mi-balise, qui rendait
 * l'affichage sale.
 */
export function eventCardSummary(evt: Pick<SalaEvent, "resume" | "body">, max = 160): string {
  const resume = (evt.resume || "").trim();
  if (resume) return resume;

  const plain = (evt.body || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  if (!plain) return "";
  return plain.length > max ? `${plain.slice(0, max).trimEnd()}…` : plain;
}

export interface EventContactLink {
  kind: "site" | "whatsapp-group" | "tel" | "whatsapp" | "email";
  href: string;
  label: string;
}

/**
 * Numéro en format international pour tel: et wa.me. Les numéros saisis
 * dans l'app ont des formes variées ("00242 068477993 ", "06 847 79 93") :
 * "00" devient "+", et un numéro local congolais (9 chiffres commençant par
 * 0) reçoit l'indicatif +242. Renvoie null si ce n'est pas un numéro.
 */
export function normalizePhone(raw?: string | null): string | null {
  let value = (raw || "").trim().replace(/[^\d+]/g, "");
  if (value.startsWith("00")) value = "+" + value.slice(2);
  if (!value.startsWith("+") && /^0\d{8}$/.test(value)) value = "+242" + value;
  const digits = value.replace(/\D/g, "");
  return digits.length >= 8 && digits.length <= 15 ? (value.startsWith("+") ? "+" + digits : digits) : null;
}

/**
 * Moyens de participer à un événement : Sala est un site vitrine, on
 * n'enregistre pas d'inscriptions ; on renvoie vers l'organisateur (lien
 * d'inscription, téléphone, WhatsApp, e-mail) quand il les a fournis.
 */
export function eventContactLinks(evt: Pick<EventDoc, "site" | "tel" | "email">): EventContactLink[] {
  const links: EventContactLink[] = [];
  const site = safeExternalUrl(evt.site);
  if (site) {
    const isWhatsApp = /(^|\.)(chat\.whatsapp\.com|wa\.me|whatsapp\.com)$/i.test(new URL(site).hostname);
    links.push(
      isWhatsApp
        ? { kind: "whatsapp-group", href: site, label: "Rejoindre le groupe WhatsApp" }
        : { kind: "site", href: site, label: "S'inscrire chez l'organisateur" }
    );
  }
  const phone = normalizePhone(evt.tel);
  if (phone) {
    links.push({ kind: "tel", href: `tel:${phone}`, label: "Appeler" });
    links.push({ kind: "whatsapp", href: `https://wa.me/${phone.replace(/\D/g, "")}`, label: "WhatsApp" });
  }
  const email = (evt.email || "").trim();
  if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) links.push({ kind: "email", href: `mailto:${email}`, label: "Écrire" });
  return links;
}

/** Construit un objet SalaEvent à partir d'un document Firestore brut. */
export function toSalaEvent(id: string, data: EventDoc): SalaEvent {
  return {
    id,
    ...data,
    deadlineDate: data.deadline?.toDate ? data.deadline.toDate() : null,
    deadline2Date: data.deadline2?.toDate ? data.deadline2.toDate() : null,
  };
}
