// src/context/AuthContext.tsx
// Expose l'utilisateur Firebase Auth courant (et son statut admin, utile dès
// la Phase 2) à toute l'application via un seul écouteur onAuthStateChanged.

"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

interface AuthContextValue {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue>({ user: null, isAdmin: false, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const roleSnap = await getDoc(doc(db, "roles", firebaseUser.uid));
          setIsAdmin(roleSnap.exists() && roleSnap.data()?.role === "admin");
        } catch {
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return <AuthContext.Provider value={{ user, isAdmin, loading }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
