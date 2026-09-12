// src/components/admin/AdminTopbar.tsx
// Barre supérieure du back-office : titre de section, lien vers le site
// public, email de l'admin connecté, bouton de déconnexion.

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useDarkMode } from "@/context/DarkModeContext";
import { getAdminSectionMeta } from "@/lib/admin-nav";

export function AdminTopbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const { darkMode, toggleDarkMode } = useDarkMode();
  const meta = getAdminSectionMeta(pathname);

  async function handleLogout() {
    try {
      await signOut(auth);
      router.push("/");
    } catch (err) {
      console.error("Erreur de déconnexion :", err);
    }
  }

  return (
    <header className="sala-topbar admin-topbar">
      <div>
        <div className="admin-topbar-title">{meta.title}</div>
        <div className="admin-topbar-subtitle">{meta.subtitle}</div>
      </div>
      <div className="admin-topbar-actions">
        <button
          type="button"
          className="admin-icon-btn"
          title={darkMode ? "Passer en mode clair" : "Passer en mode sombre"}
          aria-label="Mode sombre"
          onClick={toggleDarkMode}
        >
          <i className={`fas ${darkMode ? "fa-sun" : "fa-moon"}`}></i>
        </button>
        <Link href="/" target="_blank" className="admin-icon-btn" title="Voir le site public">
          <i className="fas fa-external-link-alt"></i>
        </Link>
        {user && <span className="admin-user-chip">Connecté : {user.email}</span>}
        <button className="btn-sala-outline-red" onClick={handleLogout}>
          <i className="fas fa-sign-out-alt"></i> Déconnexion
        </button>
      </div>
    </header>
  );
}
