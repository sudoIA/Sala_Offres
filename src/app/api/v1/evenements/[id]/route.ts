// src/app/api/v1/evenements/[id]/route.ts
// GET /api/v1/evenements/{id} : détail d'un événement visible et non terminé.

import { NextRequest } from "next/server";
import { apiError, apiJson, apiOptions, handleGet } from "@/lib/api/http";
import { readDocument } from "@/lib/api/server-data";
import { isEventVisible, toApiEvent } from "@/lib/api/serializers";
import { resolveImage } from "@/lib/api/images";
import { getSiteUrl } from "@/lib/site-url";

export const runtime = "nodejs";

export function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  return handleGet(req, async () => {
    const { id } = await ctx.params;
    if (!/^[\w-]{1,128}$/.test(id)) return apiError(400, "Identifiant invalide.");
    const doc = await readDocument("events", id);
    if (!doc || !isEventVisible(doc)) return apiError(404, "Événement introuvable ou terminé.");
    const event = toApiEvent(doc, getSiteUrl());
    event.image = await resolveImage("events", doc.image);
    return apiJson({ data: event });
  });
}

export const OPTIONS = apiOptions;
