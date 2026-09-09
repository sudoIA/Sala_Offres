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

  const logo = { url: "/img/logo_share_black.png", width: 1200, height: 630, alt: "Logo Sala" };

  return {
    title,
    description,
    openGraph: { title, description, type: "article", images: [logo] },
    twitter: { card: "summary_large_image", title, description, images: [logo.url] },
  };
}

export default async function JobDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  return <JobDetailPageClient id={id} />;
}
