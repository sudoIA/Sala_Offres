// src/components/layout/AppTopbar.tsx
// Barre supérieure de l'"app shell". Sur /offres, affiche le profil ; sur une
// page de détail, affiche un lien de retour à la place. Le bouton du mode
// hors-ligne n'apparaît qu'en mobile (sur bureau, il est déjà dans la
// sidebar) — c'est le seul endroit où l'activer/désactiver depuis un
// téléphone, puisque la sidebar y est masquée.

"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useDarkMode } from "@/context/DarkModeContext";
import { useMobileMenu } from "@/context/MobileMenuContext";
import { isOfflineModeEnabled, setOfflineModeEnabled } from "@/lib/offline-cache";
import { notify } from "@/lib/notify";

interface AppTopbarProps {
  backHref?: string;
  backLabel?: string;
}

export function AppTopbar({ backHref, backLabel }: AppTopbarProps) {
  const { user } = useAuth();
  const { darkMode, toggleDarkMode } = useDarkMode();
  const { toggle: toggleMobileMenu } = useMobileMenu();
  const firstName = user?.displayName ? user.displayName.split(" ")[0] : "Mon profil";

  const [offlineMode, setOfflineMode] = useState(true);
  useEffect(() => {
    setOfflineMode(isOfflineModeEnabled());
  }, []);

  function handleToggleOffline() {
    const next = !offlineMode;
    setOfflineMode(next);
    setOfflineModeEnabled(next);
    notify(next ? "Mode hors-ligne activé" : "Mode hors-ligne désactivé");
  }

  return (
    <header className="sala-topbar">
      <div className="d-flex align-items-center gap-3">
        <button
          type="button"
          className="sala-burger-btn d-lg-none"
          title="Ouvrir le menu"
          aria-label="Ouvrir le menu"
          onClick={toggleMobileMenu}
        >
          <i className="fas fa-bars"></i>
        </button>
        <Link href="/" className="d-flex align-items-center text-decoration-none">
          <Image src="/img/logo_transparent.png" alt="Logo Sala" height={42} width={120} style={{ height: 42, width: "auto" }} className="me-2" />
          <span style={{ fontWeight: 800, fontSize: "1.3rem", color: "var(--sala-green)" }}>SALA</span>
        </Link>
      </div>

      <div className="d-flex align-items-center gap-2">
        <button
          type="button"
          className="btn btn-sm btn-light"
          title={darkMode ? "Passer en mode clair" : "Passer en mode sombre"}
          aria-label="Mode sombre"
          onClick={toggleDarkMode}
        >
          <i className={`fas ${darkMode ? "fa-sun" : "fa-moon"}`}></i>
        </button>
        <button
          type="button"
          className="btn btn-sm btn-light d-lg-none"
          title={offlineMode ? "Mode hors-ligne activé (offres enregistrées sur l'appareil)" : "Mode hors-ligne désactivé"}
          aria-label="Mode hors-ligne"
          onClick={handleToggleOffline}
        >
          <i className={`fas fa-wifi ${offlineMode ? "text-success" : "text-muted"}`}></i>
        </button>

        {backHref ? (
          <Link href={backHref} className="btn-sala-outline py-1 px-3" style={{ fontSize: "0.85rem" }}>
            <i className="fas fa-arrow-left me-1"></i> {backLabel || "Retour"}
          </Link>
        ) : user ? (
          <Link href="/profile" className="btn-sala-primary py-1 px-3" style={{ fontSize: "0.85rem" }} title={firstName}>
            <i className="fas fa-user-circle d-sm-none"></i>
            <span className="d-none d-sm-inline">
              <i className="fas fa-user-circle me-1"></i> {firstName}
            </span>
          </Link>
        ) : (
          <Link href="/auth" className="btn-sala-outline py-1 px-3" style={{ fontSize: "0.85rem" }} title="Connexion">
            <i className="fas fa-user d-sm-none"></i>
            <span className="d-none d-sm-inline">
              <i className="fas fa-user me-1"></i> Connexion
            </span>
          </Link>
        )}
      </div>
    </header>
  );
}
