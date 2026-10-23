// src/app/api/client-errors/route.ts
// Reçoit les erreurs JavaScript rencontrées par les visiteurs (voir
// src/components/ErrorReporter.tsx) et les enregistre dans "client_errors",
// consultable dans Admin > Journal. Alternative légère à un service externe
// (Sentry...) : aucun compte tiers, aucune donnée personnelle collectée.
//
// Écriture via le SDK Admin (les règles Firestore interdisent toute écriture
// directe dans cette collection depuis un navigateur). Garde-fous contre les
// abus : taille des champs plafonnée et nombre d'envois limité par adresse IP.

import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 10;
const recentByIp = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const hits = (recentByIp.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  hits.push(now);
  recentByIp.set(ip, hits);
  if (recentByIp.size > 5000) recentByIp.clear(); // borne la mémoire de l'instance
  return hits.length > MAX_PER_WINDOW;
}

const clip = (value: unknown, max: number) => (typeof value === "string" ? value.slice(0, max) : "");

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "inconnue";
  if (rateLimited(ip)) return new NextResponse(null, { status: 429 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  const message = clip(body.message, 500);
  if (!message) return new NextResponse(null, { status: 400 });

  try {
    await getAdminDb()
      .collection("client_errors")
      .add({
        message,
        stack: clip(body.stack, 2000),
        page: clip(body.page, 300),
        userAgent: clip(req.headers.get("user-agent"), 300),
        at: FieldValue.serverTimestamp(),
      });
  } catch (err) {
    // Typiquement : FIREBASE_SERVICE_ACCOUNT absent (développement local).
    console.warn("Erreur client non enregistrée :", err instanceof Error ? err.message : err);
  }
  return new NextResponse(null, { status: 204 });
}
