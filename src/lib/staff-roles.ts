// src/lib/staff-roles.ts
// Rôles de l'équipe Sala dans le back-office, enregistrés dans roles/{uid}
// (champ "role") et appliqués à trois endroits : l'interface (menus et
// pages, voir admin-nav.ts), les routes API (admin-auth.ts) et les règles
// Firestore (isAdmin() / isStaff()).
//
// - admin : accès complet, y compris l'équipe, les réglages et l'affichage
//   des pages publiques ;
// - moderateur : publie, modifie et valide les offres d'emploi (dont les
//   offres collectées automatiquement), sans toucher au reste du site.

export type StaffRole = "admin" | "moderateur";

export const STAFF_ROLES: StaffRole[] = ["admin", "moderateur"];

export const ROLE_INFO: Record<StaffRole, { label: string; description: string }> = {
  admin: {
    label: "Administrateur",
    description: "Accès complet : contenus, équipe, réglages et affichage du site.",
  },
  moderateur: {
    label: "Modérateur",
    description: "Offres d'emploi uniquement : publier, modifier et valider les offres collectées.",
  },
};

export function isStaffRole(value: unknown): value is StaffRole {
  return value === "admin" || value === "moderateur";
}

/** Premier nom renseigné parmi les candidats (passer l'e-mail en dernier comme solution de repli). */
export function staffDisplayName(...candidates: (string | null | undefined)[]): string {
  for (const c of candidates) {
    const name = (c || "").trim();
    if (name) return name;
  }
  return "";
}

/** Membre de l'équipe tel que renvoyé par /api/admin/team (Admin > Équipe). */
export interface TeamMember {
  uid: string;
  email: string;
  name: string;
  role: StaffRole;
  /** Double authentification configurée. */
  mfa: boolean;
  /** Dernière connexion (ISO), null si le compte ne s'est jamais connecté. */
  lastLoginAt: string | null;
}
