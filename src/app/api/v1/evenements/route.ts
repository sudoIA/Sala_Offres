// src/app/api/v1/evenements/route.ts
// GET /api/v1/evenements : événements visibles, à venir ou en cours (jusqu'à
// leur date de fin), du plus proche au plus lointain. Filtre : ville.

import { NextRequest } from "next/server";
import { apiJson, apiOptions, handleGet, textParam } from "@/lib/api/http";
import { readCollection } from "@/lib/api/server-data";
import { isEventVisible, searchable, toApiEvent } from "@/lib/api/serializers";
import { resolveImage } from "@/lib/api/images";
import { getSiteUrl } from "@/lib/site-url";

export const runtime = "nodejs";

export function GET(req: NextRequest) {
  return handleGet(req, async () => {
    const ville = searchable(textParam(req, "ville"));
    const siteUrl = getSiteUrl();
    const docs = await readCollection("events");
    const items = docs
      .filter((d) => isEventVisible(d))
      .map((d) => ({ doc: d, event: toApiEvent(d, siteUrl) }))
      .filter(({ event }) => !ville || searchable(event.city).includes(ville))
      .sort((a, b) => (a.event.start || "9999").localeCompare(b.event.start || "9999"));

    await Promise.all(items.map(async (x) => (x.event.image = await resolveImage("events", x.doc.image))));
    return apiJson({ data: items.map((x) => x.event) });
  });
}

export const OPTIONS = apiOptions;
