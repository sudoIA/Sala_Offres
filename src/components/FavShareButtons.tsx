// src/components/FavShareButtons.tsx
// Boutons favori (localStorage) + partage, utilisés dans les cartes et le
// panneau/page de détail d'une offre.

"use client";

import { useEffect, useState } from "react";
import { isFavori, shareJob, toggleFavori } from "@/lib/job-helpers";
import type { Job } from "@/types/job";

export function FavShareButtons({ job, shareUrl }: { job: Job; shareUrl: string }) {
  const [fav, setFav] = useState(false);

  useEffect(() => {
    setFav(isFavori(job.id));
  }, [job.id]);

  return (
    <div className="d-flex justify-content-end gap-3 mb-3">
      <button
        className={`sala-bookmark-btn${fav ? " active" : ""}`}
        title="Ajouter aux favoris"
        onClick={() => setFav(toggleFavori(job.id))}
      >
        <i className="fas fa-bookmark"></i>
      </button>
      <button className="sala-bookmark-btn" title="Partager" onClick={() => shareJob(job, shareUrl)}>
        <i className="fas fa-share-alt"></i>
      </button>
    </div>
  );
}
