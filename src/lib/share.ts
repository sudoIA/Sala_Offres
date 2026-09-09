// src/lib/share.ts
// Partage générique d'un lien (API Web Share si disponible sur l'appareil,
// sinon copie dans le presse-papier). Voir aussi shareJob() dans
// job-helpers.ts pour le cas spécifique d'une offre.

import { notify } from "./notify";

export function shareLink(title: string, text: string, url: string): void {
  if (typeof navigator !== "undefined" && navigator.share) {
    navigator.share({ title, text, url }).catch(() => {});
  } else if (typeof navigator !== "undefined" && navigator.clipboard) {
    navigator.clipboard.writeText(url).then(() => {
      notify("Lien copié dans le presse-papier !");
    });
  }
}
