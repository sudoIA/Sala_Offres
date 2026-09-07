// src/types/user-profile.ts
// Profil candidat stocké dans la collection Firestore "users" (distincte de
// Firebase Auth). Le rôle admin est stocké séparément dans "roles/{uid}".

import type { Timestamp } from "firebase/firestore";

export interface UserProfileDoc {
  fullName?: string;
  email?: string;
  city?: string;
  phone?: string;
  bio?: string;
  photoURL?: string | null;
  skills?: string[];
  savedJobs?: string[];
  applications?: string[];
  createdAt?: Timestamp;
}

export interface UserProfile extends UserProfileDoc {
  id: string;
}
