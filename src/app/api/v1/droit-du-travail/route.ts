// src/app/api/v1/droit-du-travail/route.ts
// GET /api/v1/droit-du-travail : fiches de la collection "legislation", dans
// l'ordre d'affichage. Filtre : theme (contrat, salaire, horaires...).

import { NextRequest } from "next/server";
import { apiJson, apiOptions, handleGet, textParam } from "@/lib/api/http";
import { readCollection } from "@/lib/api/server-data";
import { toApiFiche } from "@/lib/api/serializers";

export const runtime = "nodejs";

export function GET(req: NextRequest) {
  return handleGet(req, async () => {
    const theme = textParam(req, "theme", 40);
    const docs = await readCollection("legislation");
    const data = docs
      .map(toApiFiche)
      .filter((f) => !theme || f.topic === theme)
      .sort((a, b) => a.order - b.order);
    return apiJson({ data }, 3600);
  });
}

export const OPTIONS = apiOptions;
