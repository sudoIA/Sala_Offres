// src/lib/server-sanitize.ts
// Nettoyage HTML côté serveur (collecteurs d'offres, API /api/v1), par liste
// blanche de balises et d'attributs.
//
// Pourquoi pas DOMPurify ici : côté serveur, isomorphic-dompurify charge
// jsdom, qui plante au démarrage des fonctions Vercel (fichier de données
// absent du déploiement) - toutes les routes qui l'importaient répondaient
// 500 en production. cheerio, déjà utilisé par les collecteurs, suffit pour
// une liste blanche. Les pages du site (navigateur) gardent DOMPurify.

import * as cheerio from "cheerio";
import type { AnyNode, Element } from "domhandler";
import { safeExternalUrl } from "@/lib/safe-url";

/** Balises supprimées avec tout leur contenu (jamais simplement "déballées"). */
const DROPPED_WITH_CONTENT = new Set(["script", "style", "iframe", "object", "embed", "noscript", "template", "svg", "math", "head", "title", "form", "textarea", "select", "button"]);

export interface SanitizeOptions {
  /** Balises conservées ; les autres sont retirées mais leur texte est gardé. */
  allowedTags: string[];
  /** Attributs conservés, par balise (ex. { a: ["href"] }). */
  allowedAttrs?: Record<string, string[]>;
}

/** Liens sûrs uniquement : http(s), mailto:, tel:. */
function safeHref(value: string): string | null {
  const v = value.trim();
  if (/^(mailto|tel):/i.test(v)) return v;
  return safeExternalUrl(v);
}

export function sanitizeHtmlServer(html: string, { allowedTags, allowedAttrs = {} }: SanitizeOptions): string {
  if (!html) return "";
  const allowed = new Set(allowedTags.map((t) => t.toLowerCase()));
  const $ = cheerio.load(html, null, false);

  const visit = (nodes: AnyNode[]) => {
    for (const node of [...nodes]) {
      if (node.type === "comment" || node.type === "directive" || node.type === "cdata") {
        $(node).remove();
        continue;
      }
      if (node.type !== "tag" && node.type !== "script" && node.type !== "style") continue;
      const el = node as Element;
      const name = el.name.toLowerCase();
      if (DROPPED_WITH_CONTENT.has(name)) {
        $(el).remove();
        continue;
      }
      visit(el.children);
      if (!allowed.has(name)) {
        $(el).replaceWith($(el).contents());
        continue;
      }
      const keep = allowedAttrs[name] || [];
      for (const attr of Object.keys(el.attribs)) {
        const value = el.attribs[attr];
        if (!keep.includes(attr)) {
          $(el).removeAttr(attr);
        } else if (attr === "href" || attr === "src") {
          const safe = safeHref(value);
          if (safe) $(el).attr(attr, safe);
          else $(el).removeAttr(attr);
        }
      }
    }
  };

  visit($.root().contents().toArray());
  return $.html();
}

/** Mise en forme courante d'un contenu riche (descriptions d'offres, fiches, news). */
export const RICH_TEXT: SanitizeOptions = {
  allowedTags: ["p", "br", "b", "strong", "i", "em", "u", "ul", "ol", "li", "a", "h1", "h2", "h3", "h4", "h5", "h6", "div", "span", "blockquote"],
  allowedAttrs: { a: ["href"], div: ["class"], span: ["class"], p: ["class"] },
};
