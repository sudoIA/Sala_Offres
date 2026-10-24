// src/lib/api/http.ts
// Réponses de l'API publique /api/v1 : JSON, ouverte à toutes les origines
// (données déjà publiques sur le site), mise en cache par le CDN de Vercel
// et limite de requêtes par adresse IP contre les abus.

import { NextRequest, NextResponse } from "next/server";

/** Durée de cache CDN (secondes) ; le CDN sert ensuite l'ancienne version le temps de rafraîchir. */
const DEFAULT_MAX_AGE = 300;

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 120;
const recentByIp = new Map<string, number[]>();

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function clientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "inconnue";
}

/** Vrai si l'adresse IP a dépassé MAX_PER_WINDOW requêtes sur la dernière minute. */
export function isRateLimited(req: NextRequest): boolean {
  const ip = clientIp(req);
  const now = Date.now();
  const hits = (recentByIp.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  hits.push(now);
  recentByIp.set(ip, hits);
  if (recentByIp.size > 5000) recentByIp.clear(); // borne la mémoire de l'instance
  return hits.length > MAX_PER_WINDOW;
}

export function apiJson(body: unknown, maxAge = DEFAULT_MAX_AGE): NextResponse {
  return NextResponse.json(body, {
    headers: {
      ...CORS_HEADERS,
      "Cache-Control": `public, max-age=60, s-maxage=${maxAge}, stale-while-revalidate=${maxAge * 2}`,
    },
  });
}

export function apiError(status: number, message: string): NextResponse {
  return NextResponse.json(
    { error: { status, message } },
    { status, headers: { ...CORS_HEADERS, "Cache-Control": "no-store" } }
  );
}

export function apiOptions(): NextResponse {
  return new NextResponse(null, { status: 204, headers: { ...CORS_HEADERS, "Access-Control-Max-Age": "86400" } });
}

/**
 * Enveloppe commune des routes GET : limite de requêtes, puis gestion des
 * erreurs (jamais de détail interne renvoyé au client).
 */
export async function handleGet(req: NextRequest, handler: () => Promise<NextResponse>): Promise<NextResponse> {
  if (isRateLimited(req)) return apiError(429, "Trop de requêtes. Réessayez dans une minute.");
  try {
    return await handler();
  } catch (err) {
    console.error("Erreur API v1 :", req.nextUrl.pathname, err);
    return apiError(500, "Erreur interne. Réessayez plus tard.");
  }
}

/** Entier borné lu dans la query string (valeur par défaut si absent ou invalide). */
export function intParam(req: NextRequest, name: string, fallback: number, min: number, max: number): number {
  const raw = Number.parseInt(req.nextUrl.searchParams.get(name) || "", 10);
  if (Number.isNaN(raw)) return fallback;
  return Math.min(max, Math.max(min, raw));
}

/** Texte lu dans la query string, coupé à `max` caractères. */
export function textParam(req: NextRequest, name: string, max = 100): string {
  return (req.nextUrl.searchParams.get(name) || "").trim().slice(0, max);
}
