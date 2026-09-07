// src/types/cv.ts
// Forme de l'état du générateur de CV, partagée entre le formulaire, les 3
// modèles de rendu et l'export PDF.

export type CvTemplate = "classic" | "marine" | "moderne";

export interface CvPersonalInfo {
  fullName: string;
  jobTitle: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  birthDate: string;
  photo: string | null;
  bio: string;
}

export interface CvExperience {
  title: string;
  company: string;
  city: string;
  period: string;
  description: string;
}

export interface CvEducation {
  degree: string;
  school: string;
  city: string;
  year: string;
}

export interface CvProject {
  name: string;
  role: string;
  description: string;
}

export interface CvLanguage {
  name: string;
  level: string;
}

export interface CvState {
  template: CvTemplate;
  personal: CvPersonalInfo;
  experiences: CvExperience[];
  education: CvEducation[];
  projects: CvProject[];
  skills: string[];
  hobbies: string[];
  languages: CvLanguage[];
}

export const DEFAULT_CV_STATE: CvState = {
  template: "classic",
  personal: {
    fullName: "",
    jobTitle: "",
    email: "",
    phone: "",
    address: "",
    city: "Brazzaville",
    country: "République du Congo",
    birthDate: "",
    photo: null,
    bio: "",
  },
  experiences: [],
  education: [],
  projects: [],
  skills: [],
  hobbies: [],
  languages: [{ name: "Français", level: "Courant" }],
};

export const LEVEL_TO_PERCENT: Record<string, number> = {
  "Langue maternelle": 100,
  Courant: 85,
  Intermédiaire: 60,
  "Notions de base": 35,
};

/** Transforme un texte multi-lignes (une tâche par ligne) en tableau de puces. */
export function toBulletLines(text: string): string[] {
  if (!text) return [];
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}
