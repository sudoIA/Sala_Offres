// src/app/offres/[id]/page.tsx
// Composant serveur : génère un titre/description propres à chaque offre
// (référencement + aperçu de partage WhatsApp/Facebook/etc.), puis délègue
// tout l'affichage interactif à JobDetailPageClient (inchangé).

import type { Metadata } from "next";
import { getJobMetadata } from "@/lib/jobs-server";
import { JobDetailPageClient } from "./JobDetailPageClient";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const job = await getJobMetadata(id);

  if (!job) {
    return {
      title: "Offre introuvable — Sala",
      description: "Cette offre n'existe plus ou a été retirée.",
    };
  }

  const title = `${job.title} — ${job.company} | Sala`;
  const description = `${job.description} Poste basé à ${job.city}.`;

  return {
    title,
    description,
    openGraph: { title, description, type: "article" },
    twitter: { card: "summary", title, description },
  };
}

export default async function JobDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  return <JobDetailPageClient id={id} />;
}
