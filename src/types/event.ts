// src/types/event.ts
// Forme d'un document de la collection Firestore "evenements".

export interface EventDoc {
  title?: string;
  category?: string;
  organizer?: string;
  date?: string;
  isoDate?: string;
  time?: string;
  city?: string;
  location?: string;
  price?: string;
  badgeColor?: string;
  description?: string;
  highlights?: string[];
  registrationRequired?: boolean;
}

export interface SalaEvent extends EventDoc {
  id: string;
}

export interface Registration {
  name?: string;
  email?: string;
  phone?: string;
  eventId?: string;
}
