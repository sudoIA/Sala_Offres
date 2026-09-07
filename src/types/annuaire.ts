// src/types/annuaire.ts
// Les 3 catégories d'annuaires Sala, chacune dans sa propre collection
// Firestore, avec des champs légèrement différents.

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
}

export interface ClubDoc {
  name?: string;
  city?: string;
  location?: string;
  schedule?: string;
  coordinator?: string;
  phone?: string;
  fee?: string;
  description?: string;
}

export type AnnuaireItemDoc = UniversityDoc & CompanyDoc & ClubDoc;

export interface AnnuaireItem extends AnnuaireItemDoc {
  id: string;
}
