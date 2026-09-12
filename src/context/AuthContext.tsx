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
  /** Reflète user.emailVerified au dernier rafraîchissement connu (voir refreshEmailVerified). */
  emailVerified: boolean;
  /** Recharge l'utilisateur Firebase pour savoir si l'email vient d'être vérifié
   * (user.reload() mutant l'objet en place, on ne peut pas se fier au simple re-render). */
  refreshEmailVerified: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isAdmin: false,
  loading: true,
  emailVerified: false,
  refreshEmailVerified: async () => false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [emailVerified, setEmailVerified] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setEmailVerified(firebaseUser?.emailVerified ?? false);
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

  async function refreshEmailVerified(): Promise<boolean> {
    if (!auth.currentUser) return false;
    await auth.currentUser.reload();
    const verified = auth.currentUser.emailVerified;
    setEmailVerified(verified);
    return verified;
  }

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, emailVerified, refreshEmailVerified }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
