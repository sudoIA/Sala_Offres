// src/lib/admin-nav.ts
// Structure de navigation du back-office : une entrée par route, partagée
// entre la sidebar bureau, les onglets mobiles et le titre de la topbar.
// Chaque entrée indique les rôles qui y ont accès (voir staff-roles.ts) ;
// la garde du back-office (admin/layout.tsx) redirige les autres.

import type { StaffRole } from "@/lib/staff-roles";

const ALL_STAFF: StaffRole[] = ["admin", "moderateur"];
const ADMINS_ONLY: StaffRole[] = ["admin"];

export interface AdminNavItem {
  href: string;
  icon: string;
  label: string;
  mobileLabel: string;
  title: string;
  subtitle: string;
  roles: StaffRole[];
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  {
    href: "/admin",
    icon: "fas fa-chart-pie",
    label: "Vue d'ensemble",
    mobileLabel: "Vue d'ensemble",
    title: "Vue d'ensemble",
    subtitle: "Un coup d'œil sur l'activité de la plateforme",
    roles: ADMINS_ONLY,
  },
  {
    href: "/admin/rapport",
    icon: "fas fa-file-alt",
    label: "Rapport mensuel",
    mobileLabel: "Rapport",
    title: "Rapport mensuel",
    subtitle: "Bilan d'activité du mois, à imprimer ou partager avec les partenaires.",
    roles: ADMINS_ONLY,
  },
  {
    href: "/admin/offres",
    icon: "fas fa-briefcase",
    label: "Offres d'emploi",
    mobileLabel: "Offres",
    title: "Offres d'emploi",
    subtitle: "Publiez, modifiez ou masquez les offres visibles sur le site.",
    roles: ALL_STAFF,
  },
  {
    href: "/admin/evenements",
    icon: "fas fa-calendar-alt",
    label: "Événements",
    mobileLabel: "Événements",
    title: "Événements",
    subtitle: "Salons, ateliers et webinaires affichés sur la page Événements.",
    roles: ADMINS_ONLY,
  },
  {
    href: "/admin/annuaires",
    icon: "fas fa-address-book",
    label: "Annuaires",
    mobileLabel: "Annuaires",
    title: "Annuaires Sala",
    subtitle: "Universités, entreprises partenaires et clubs d'anglais.",
    roles: ADMINS_ONLY,
  },
  {
    href: "/admin/legislation",
    icon: "fas fa-balance-scale",
    label: "Droit du Travail",
    mobileLabel: "Droit du Travail",
    title: "Droit du Travail",
    subtitle: "Fiches thématiques du site et de l'application mobile.",
    roles: ADMINS_ONLY,
  },
  {
    href: "/admin/quiz",
    icon: "fas fa-gamepad",
    label: "Quiz",
    mobileLabel: "Quiz",
    title: "Quiz",
    subtitle: "Questions des quiz du site et de l'application mobile.",
    roles: ADMINS_ONLY,
  },
  {
    href: "/admin/actualites",
    icon: "fas fa-newspaper",
    label: "News Sala",
    mobileLabel: "News",
    title: "News Sala",
    subtitle: "Actualités de l'ONG affichées sur la page publique « Actualités ».",
    roles: ADMINS_ONLY,
  },
  {
    href: "/admin/imports",
    icon: "fas fa-cloud-download-alt",
    label: "Imports",
    mobileLabel: "Imports",
    title: "Imports d'offres",
    subtitle: "Offres collectées automatiquement (ACPE...), à valider avant publication.",
    roles: ALL_STAFF,
  },
  {
    href: "/admin/utilisateurs",
    icon: "fas fa-users",
    label: "Utilisateurs",
    mobileLabel: "Utilisateurs",
    title: "Utilisateurs",
    subtitle: "Comptes candidats inscrits sur le site.",
    roles: ADMINS_ONLY,
  },
  {
    href: "/admin/equipe",
    icon: "fas fa-user-shield",
    label: "Équipe",
    mobileLabel: "Équipe",
    title: "Équipe",
    subtitle: "Comptes de l'équipe Sala et leurs droits dans ce tableau de bord.",
    roles: ADMINS_ONLY,
  },
  {
    href: "/admin/journal",
    icon: "fas fa-history",
    label: "Journal",
    mobileLabel: "Journal",
    title: "Journal",
    subtitle: "Historique des actions de l'équipe et erreurs rencontrées par les visiteurs.",
    roles: ADMINS_ONLY,
  },
  {
    href: "/admin/parametres",
    icon: "fas fa-cog",
    label: "Paramètres",
    mobileLabel: "Paramètres",
    title: "Paramètres",
    subtitle: "Votre compte et les réglages généraux du site.",
    roles: ALL_STAFF,
  },
];

export function getAdminSectionMeta(pathname: string): AdminNavItem {
  const exact = ADMIN_NAV_ITEMS.find((item) => item.href === pathname);
  if (exact) return exact;
  const partial = ADMIN_NAV_ITEMS.filter((item) => item.href !== "/admin" && pathname.startsWith(item.href));
  return partial[0] || ADMIN_NAV_ITEMS[0];
}

/** Entrées du menu visibles pour ce rôle. */
export function adminNavFor(role: StaffRole | null): AdminNavItem[] {
  return role ? ADMIN_NAV_ITEMS.filter((item) => item.roles.includes(role)) : [];
}

/** Section du back-office correspondant à l'adresse, ou null si elle n'existe pas dans le menu. */
function sectionOf(pathname: string): AdminNavItem | null {
  return (
    ADMIN_NAV_ITEMS.find((item) => item.href === pathname) ||
    ADMIN_NAV_ITEMS.find((item) => item.href !== "/admin" && pathname.startsWith(item.href + "/")) ||
    null
  );
}

/** Vrai si ce rôle peut ouvrir cette page du back-office. */
export function canAccessAdminPath(pathname: string, role: StaffRole | null): boolean {
  const section = sectionOf(pathname);
  return !!role && (section ? section.roles.includes(role) : role === "admin");
}
