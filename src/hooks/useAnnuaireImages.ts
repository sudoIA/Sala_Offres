// src/hooks/useAnnuaireImages.ts
// Résout le logo et la photo du bâtiment d'une fiche annuaire. La plupart
// des fiches existantes ne stockent ni logo ni photo comme une URL directe,
// mais comme un nom de fichier (ex: logo: "esgae_logo.png", "image
// batiment": "esgae_bati.jpg" — ce dernier avec une espace dans le nom du
// champ, tel quel dans Firestore) à chercher dans le dossier Firebase
// Storage de la catégorie ("universites" / "entreprises" / "clubs_anglais",
// voir findStorageFileUrl) — même convention que les logos d'entreprise des
// offres d'emploi (job-helpers.ts). Si le champ contient déjà une URL
// http(s), typiquement une fiche créée depuis notre formulaire admin, on
// l'utilise telle quelle sans recherche Storage.

"use client";

import { useEffect, useState } from "react";
import { findStorageFileUrl } from "@/lib/storage-lookup";
import { ANNUAIRE_COLLECTIONS, type AnnuaireCategory, type AnnuaireItem } from "@/types/annuaire";

function baseName(value?: string | null): string {
  return (value || "").replace(/\.[^.]+$/, "").trim();
}

function isUrl(value?: string | null): boolean {
  return !!value && /^https?:\/\//i.test(value);
}

interface AnnuaireImages {
  logoUrl: string | null;
  photoUrl: string | null;
}

export function useAnnuaireImages(
  category: AnnuaireCategory,
  item: Pick<AnnuaireItem, "logo" | "photo" | "image batiment">
): AnnuaireImages {
  const folder = ANNUAIRE_COLLECTIONS[category];
  const logoRaw = item.logo || "";
  const photoRaw = item.photo || "";
  const buildingRaw = item["image batiment"] || "";

  const [logoUrl, setLogoUrl] = useState<string | null>(isUrl(logoRaw) ? logoRaw : null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(isUrl(photoRaw) ? photoRaw : null);

  useEffect(() => {
    let cancelled = false;
    if (isUrl(logoRaw)) {
      setLogoUrl(logoRaw);
    } else if (logoRaw) {
      findStorageFileUrl(folder, baseName(logoRaw), { bidirectional: true }).then((url) => {
        if (!cancelled) setLogoUrl(url);
      });
    } else {
      setLogoUrl(null);
    }
    return () => {
      cancelled = true;
    };
  }, [folder, logoRaw]);

  useEffect(() => {
    let cancelled = false;
    if (isUrl(photoRaw)) {
      setPhotoUrl(photoRaw);
    } else if (buildingRaw) {
      findStorageFileUrl(folder, baseName(buildingRaw), { bidirectional: true }).then((url) => {
        if (!cancelled) setPhotoUrl(url);
      });
    } else {
      setPhotoUrl(null);
    }
    return () => {
      cancelled = true;
    };
  }, [folder, photoRaw, buildingRaw]);

  return { logoUrl, photoUrl };
}
