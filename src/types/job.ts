// src/types/job.ts
// Forme d'un document de la collection Firestore "emplois".

import type { Timestamp } from "firebase/firestore";

export interface JobDoc {
  title?: string;
  company?: string;
  city?: string;
  contract?: string;
  body?: string;
  languages?: string;
  email?: string;
  site?: string;
  tel?: string;
  competences?: string[];
  visibility?: boolean;
  deadline?: Timestamp;
  timestamp?: Timestamp;
}

/** Offre enrichie côté client avec sa date limite déjà convertie en `Date`. */
export interface Job extends JobDoc {
  id: string;
  deadlineDate: Date | null;
}
