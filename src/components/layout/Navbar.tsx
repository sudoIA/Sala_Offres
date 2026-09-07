// src/components/layout/Navbar.tsx
// Navbar marketing de la page d'accueil. Le menu mobile est géré par un état
// React (plutôt que le JS de Bootstrap) pour rester cohérent avec le reste
// de l'application.

"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useSiteSettings } from "@/hooks/useSiteSettings";

export function Navbar() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const settings = useSiteSettings();
  const firstName = user?.displayName ? user.displayName.split(" ")[0] : "Mon profil";

  return (
    <nav className="navbar navbar-expand-lg bg-white navbar-light sticky-top p-0" style={{ borderBottom: "1px solid var(--sala-border)" }}>
      <Link href="/" className="navbar-brand d-flex align-items-center py-0 px-4 px-lg-5">
        <Image src="/img/logo_transparent.png" alt="Logo Sala" height={38} width={110} style={{ height: 38, width: "auto" }} className="me-2" priority />
        <span style={{ fontFamily: "var(--sala-font-display)", fontWeight: 800, fontSize: "1.25rem", color: "var(--sala-green-dark)" }}>SALA</span>
      </Link>
      <button type="button" className="navbar-toggler me-4" onClick={() => setOpen((v) => !v)} aria-label="Menu">
        <span className="navbar-toggler-icon"></span>
      </button>
      <div className={`collapse navbar-collapse${open ? " show" : ""}`}>
        <div className="navbar-nav ms-auto p-4 p-lg-0">
          <Link href="/" className="nav-item nav-link active">Accueil</Link>
          <Link href="/offres" className="nav-item nav-link">Offres d&apos;emploi</Link>
          {settings.sectionsVisible.evenements && <Link href="/evenements" className="nav-item nav-link">Événements</Link>}
          {settings.sectionsVisible.annuaires && <Link href="/annuaires" className="nav-item nav-link">Annuaires</Link>}
          {settings.sectionsVisible.entretiens && <Link href="/entretiens" className="nav-item nav-link">Entretiens</Link>}
          {settings.sectionsVisible.legislation && <Link href="/legislation" className="nav-item nav-link">Législation</Link>}
          {!user && (
            <Link href="/auth" className="nav-item nav-link d-lg-none">
              <i className="fas fa-user me-1"></i> Espace Candidat
            </Link>
          )}
        </div>
        <div className="d-none d-lg-flex align-items-center me-3">
          {user ? (
            <Link href="/profile" className="btn-sala-primary py-2 px-3" style={{ fontSize: "0.88rem" }}>
              <i className="fas fa-user-circle me-1"></i> {firstName}
            </Link>
          ) : (
            <Link href="/auth" className="btn-sala-outline py-2 px-3" style={{ fontSize: "0.88rem" }}>
              <i className="fas fa-user me-1"></i> Connexion
            </Link>
          )}
        </div>
        <Link href="/cv-builder" className="btn-sala-accent py-2 px-3 me-4 me-lg-5 d-none d-lg-inline-flex">
          <i className="fas fa-file-invoice"></i> Créer mon CV
        </Link>
      </div>
    </nav>
  );
}
