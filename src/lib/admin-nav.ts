// src/lib/admin-nav.ts
// Structure de navigation du back-office : une entrée par route, partagée
// entre la sidebar bureau, les onglets mobiles et le titre de la topbar.

export interface AdminNavItem {
  href: string;
  icon: string;
  label: string;
  mobileLabel: string;
  title: string;
  subtitle: string;
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  {
    href: "/admin",
    icon: "fas fa-chart-pie",
    label: "Vue d'ensemble",
    mobileLabel: "Vue d'ensemble",
    title: "Vue d'ensemble",
    subtitle: "Un coup d'œil sur l'activité de la plateforme",
  },
  {
    href: "/admin/offres",
    icon: "fas fa-briefcase",
    label: "Offres d'emploi",
    mobileLabel: "Offres",
    title: "Offres d'emploi",
    subtitle: "Publiez, modifiez ou masquez les offres visibles sur le site.",
  },
  {
    href: "/admin/evenements",
    icon: "fas fa-calendar-alt",
    label: "Événements",
    mobileLabel: "Événements",
    title: "Événements",
    subtitle: "Salons, ateliers et webinaires affichés sur la page Événements.",
  },
  {
    href: "/admin/annuaires",
    icon: "fas fa-address-book",
    label: "Annuaires",
    mobileLabel: "Annuaires",
    title: "Annuaires Sala",
    subtitle: "Universités, entreprises partenaires et clubs d'anglais.",
  },
  {
    href: "/admin/legislation",
    icon: "fas fa-balance-scale",
    label: "Droit du Travail",
    mobileLabel: "Droit du Travail",
    title: "Droit du Travail",
    subtitle: "Fiches thématiques affichées sur la page Législation.",
  },
  {
    href: "/admin/utilisateurs",
    icon: "fas fa-users",
    label: "Utilisateurs",
    mobileLabel: "Utilisateurs",
    title: "Utilisateurs",
    subtitle: "Comptes candidats inscrits. Promouvoir un compte donne accès à ce tableau de bord.",
  },
  {
    href: "/admin/parametres",
    icon: "fas fa-cog",
    label: "Paramètres",
    mobileLabel: "Paramètres",
    title: "Paramètres",
    subtitle: "Votre compte administrateur et les réglages généraux du site.",
  },
];

export function getAdminSectionMeta(pathname: string): AdminNavItem {
  const exact = ADMIN_NAV_ITEMS.find((item) => item.href === pathname);
  if (exact) return exact;
  const partial = ADMIN_NAV_ITEMS.filter((item) => item.href !== "/admin" && pathname.startsWith(item.href));
  return partial[0] || ADMIN_NAV_ITEMS[0];
}
