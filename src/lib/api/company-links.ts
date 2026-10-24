// src/lib/api/company-links.ts
// Relie chaque offre de l'API à sa fiche de l'annuaire des entreprises (même
// rapprochement par nom que le site, voir src/lib/company-match.ts) : renseigne
// `companyId` (page /api/v1/entreprises/{id}) et `logo`, pris d'abord sur la
// fiche, sinon dans le dossier Storage "entreprises/" d'après le nom.

import { matchesCompanyItem } from "@/lib/company-match";
import { readCollection } from "@/lib/api/server-data";
import { resolveImage } from "@/lib/api/images";
import type { ApiJob } from "@/lib/api/serializers";

export async function attachCompanies(jobs: ApiJob[]): Promise<void> {
  if (!jobs.length) return;
  const fiches = await readCollection("entreprises");
  await Promise.all(
    jobs.map(async (job) => {
      const fiche = fiches.find((f) => matchesCompanyItem(job.company, f)) || null;
      job.companyId = fiche?.id || null;
      job.logo = (fiche && (await resolveImage("entreprises", fiche.logo, true))) || (await resolveImage("entreprises", job.company, true));
    })
  );
}
