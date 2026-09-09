// src/types/annuaire.ts
// Les 3 catégories d'annuaires Sala, chacune dans sa propre collection
// Firestore, avec des champs légèrement différents.
//
// Toutes les catégories partagent le même modèle d'affichage : une carte
// compacte (logo, type, ville, résumé) qui, au clic, ouvre le détail complet
// (description, liste de filières/domaines/activités, carte de localisation).

export type AnnuaireCategory = "universities" | "companies" | "clubs";

export const ANNUAIRE_COLLECTIONS: Record<AnnuaireCategory, string> = {
  universities: "universites",
  companies: "entreprises",
  clubs: "clubs_anglais",
};

export interface UniversityDoc {
  name?: string;
  type?: string;
  city?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  faculties?: string[];
  logo?: string;
  summary?: string;
  description?: string;
  verified?: boolean;
}

export interface CompanyDoc {
  name?: string;
  sector?: string;
  city?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  description?: string;
  services?: string[];
  logo?: string;
  summary?: string;
  verified?: boolean;
}

export interface ClubDoc {
  name?: string;
  type?: string;
  city?: string;
  location?: string;
  schedule?: string;
  coordinator?: string;
  phone?: string;
  fee?: string;
  description?: string;
  activities?: string[];
  logo?: string;
  summary?: string;
  verified?: boolean;
}

export type AnnuaireItemDoc = UniversityDoc & CompanyDoc & ClubDoc;

export interface AnnuaireItem extends AnnuaireItemDoc {
  id: string;
}
