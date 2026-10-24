// src/app/api/v1/annuaires/route.ts
// GET /api/v1/annuaires?categorie=universites|entreprises|clubs : fiches d'un
// annuaire, triées par nom. Filtre : ville.

import { NextRequest } from "next/server";
import { apiError, apiJson, apiOptions, handleGet, textParam } from "@/lib/api/http";
import { readCollection } from "@/lib/api/server-data";
import { API_ANNUAIRE_CATEGORIES, searchable, toApiAnnuaire } from "@/lib/api/serializers";
import { resolveImage } from "@/lib/api/images";
import { ANNUAIRE_COLLECTIONS } from "@/types/annuaire";

export const runtime = "nodejs";

export function GET(req: NextRequest) {
  return handleGet(req, async () => {
    const categoryKey = textParam(req, "categorie", 20);
    const category = API_ANNUAIRE_CATEGORIES[categoryKey];
    if (!category) return apiError(400, "Paramètre « categorie » requis : universites, entreprises ou clubs.");
    const ville = searchable(textParam(req, "ville"));

    const folder = ANNUAIRE_COLLECTIONS[category];
    const docs = await readCollection(folder);
    const items = docs
      .map((d) => ({ doc: d, item: toApiAnnuaire(d, categoryKey) }))
      .filter(({ item }) => !ville || searchable(item.city).includes(ville))
      .sort((a, b) => a.item.name.localeCompare(b.item.name, "fr"));

    await Promise.all(
      items.map(async ({ doc, item }) => {
        item.logo = await resolveImage(folder, doc.logo, true);
        // Photo : URL directe (formulaire admin), sinon nom de fichier "image batiment" (fiches importées).
        item.photo = (await resolveImage(folder, doc.photo, true)) || (await resolveImage(folder, doc["image batiment"], true));
      })
    );
    return apiJson({ data: items.map((x) => x.item) }, 3600);
  });
}

export const OPTIONS = apiOptions;
