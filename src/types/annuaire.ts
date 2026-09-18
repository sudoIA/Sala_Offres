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

/**
 * Champs vus tels quels dans une bonne partie des fiches déjà en base
 * (import différent de notre formulaire admin : "contenu" au lieu de
 * "description", "site" au lieu de "website", "tel"/"tel2" au lieu de
 * "phone"...). On les garde lisibles en repli (voir annuaire-helpers.ts)
 * pour ne rien perdre de ce qui existe déjà, sans avoir à tout ressaisir.
 */
export interface AnnuaireLegacyFields {
  full_name?: string;
  contenu?: string;
  site?: string;
  tel?: string;
  tel2?: string;
  email2?: string;
  statut?: string;
  /**
   * Nom de fichier (pas une URL) d'une photo du bâtiment, à chercher dans le
   * dossier Firebase Storage de la catégorie — voir useAnnuaireImages. Le nom
   * du champ contient une espace (pas un underscore) tel qu'il existe déjà
   * dans les fiches Firestore.
   */
  "image batiment"?: string;
}

export interface UniversityDoc extends AnnuaireLegacyFields {
  name?: string;
  type?: string;
  city?: string;
  district?: string;
  building?: string;
  address?: string;
  hours?: string;
  phone?: string;
  email?: string;
  website?: string;
  faculties?: string[];
  logo?: string;
  photo?: string;
  summary?: string;
  description?: string;
  verified?: boolean;
}

export interface CompanyDoc extends AnnuaireLegacyFields {
  name?: string;
  sector?: string;
  city?: string;
  district?: string;
  building?: string;
  address?: string;
  hours?: string;
  phone?: string;
  email?: string;
  website?: string;
  description?: string;
  services?: string[];
  logo?: string;
  photo?: string;
  summary?: string;
  verified?: boolean;
}

export interface ClubDoc extends AnnuaireLegacyFields {
  name?: string;
  type?: string;
  city?: string;
  district?: string;
  building?: string;
  location?: string;
  schedule?: string;
  coordinator?: string;
  phone?: string;
  fee?: string;
  description?: string;
  activities?: string[];
  logo?: string;
  photo?: string;
  summary?: string;
  verified?: boolean;
}

export type AnnuaireItemDoc = UniversityDoc & CompanyDoc & ClubDoc;

export interface AnnuaireItem extends AnnuaireItemDoc {
  id: string;
}
