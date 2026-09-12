// src/context/DarkModeContext.tsx
// Mode sombre, disponible partout sur le site (public comme back-office) —
// une seule source de vérité pour que tous les boutons de bascule (topbar
// public, topbar admin) restent synchronisés entre eux. La préférence est
// lue depuis localStorage dans un effet (jamais pendant le rendu, ni dans un
// initialiseur de useState) pour ne pas provoquer d'erreur d'hydratation
// Next.js : le serveur n'a pas accès à localStorage, donc le premier rendu
// client doit être identique au rendu serveur (mode clair par défaut).

"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

const STORAGE_KEY = "sala-dark-mode";

interface DarkModeContextValue {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const DarkModeContext = createContext<DarkModeContextValue>({
  darkMode: false,
  toggleDarkMode: () => {},
});

export function DarkModeProvider({ children }: { children: ReactNode }) {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    let stored = false;
    try {
      stored = localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      // Stockage indisponible (navigation privée, etc.) : on reste en mode clair.
    }
    if (stored) {
      setDarkMode(true);
      document.documentElement.classList.add("dark-mode");
    }
  }, []);

  const toggleDarkMode = useCallback(() => {
    setDarkMode((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle("dark-mode", next);
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  return <DarkModeContext.Provider value={{ darkMode, toggleDarkMode }}>{children}</DarkModeContext.Provider>;
}

export function useDarkMode(): DarkModeContextValue {
  return useContext(DarkModeContext);
}
