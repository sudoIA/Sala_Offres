// src/components/layout/AppTopbar.tsx
// Barre supérieure de l'"app shell". Sur /offres, affiche le profil + le
// cadenas admin (masqué en mobile) ; sur une page de détail, affiche un lien
// de retour à la place.

"use client";

import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

interface AppTopbarProps {
  backHref?: string;
  backLabel?: string;
}

export function AppTopbar({ backHref, backLabel }: AppTopbarProps) {
  const { user } = useAuth();
  const firstName = user?.displayName ? user.displayName.split(" ")[0] : "Mon profil";

  return (
    <header className="sala-topbar">
      <div className="d-flex align-items-center gap-3">
        <Link href="/" className="d-flex align-items-center text-decoration-none">
          <Image src="/img/logo_transparent.png" alt="Logo Sala" height={42} width={120} style={{ height: 42, width: "auto" }} className="me-2" />
          <span style={{ fontWeight: 800, fontSize: "1.3rem", color: "var(--sala-green)" }}>SALA</span>
        </Link>
      </div>

      {backHref ? (
        <div className="d-flex align-items-center gap-2">
          <Link href={backHref} className="btn-sala-outline py-1 px-3" style={{ fontSize: "0.85rem" }}>
            <i className="fas fa-arrow-left me-1"></i> {backLabel || "Retour"}
          </Link>
        </div>
      ) : (
        <div className="d-flex align-items-center gap-2">
          {user ? (
            <Link href="/profile" className="btn-sala-primary py-1 px-3" style={{ fontSize: "0.85rem" }}>
              <i className="fas fa-user-circle me-1"></i> {firstName}
            </Link>
          ) : (
            <Link href="/auth" className="btn-sala-outline py-1 px-3" style={{ fontSize: "0.85rem" }}>
              <i className="fas fa-user me-1"></i> Connexion
            </Link>
          )}
          <Link href="/onboarding" className="btn btn-light py-1 px-2 text-muted" title="Découvrir Sala (Tutoriel)" style={{ fontSize: "0.85rem" }}>
            <i className="fas fa-question-circle"></i>
          </Link>
          <Link href="/connexion" className="btn btn-sm text-muted d-none d-lg-inline-block" title="Administration" style={{ fontSize: "0.85rem" }}>
            <i className="fas fa-lock"></i>
          </Link>
        </div>
      )}
    </header>
  );
}
