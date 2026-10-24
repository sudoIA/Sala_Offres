// src/context/AuthContext.tsx
// Expose l'utilisateur Firebase Auth courant (et son rôle dans l'équipe Sala,
// voir staff-roles.ts) à toute l'application via un seul écouteur
// onAuthStateChanged.

"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { isStaffRole, staffDisplayName, type StaffRole } from "@/lib/staff-roles";

interface AuthContextValue {
  user: User | null;
  /** Rôle dans l'équipe (null pour un candidat). */
  role: StaffRole | null;
  /** Accès complet au back-office. */
  isAdmin: boolean;
  /** Membre de l'équipe (admin ou modérateur) : accès au back-office. */
  isStaff: boolean;
  /** Nom affiché dans le back-office (nom du compte, sinon e-mail). */
  staffName: string;
  /** À appeler après un changement de nom (Admin > Paramètres). */
  refreshStaffName: () => Promise<void>;
  loading: boolean;
  /** Reflète user.emailVerified au dernier rafraîchissement connu (voir refreshEmailVerified). */
  emailVerified: boolean;
  /** Recharge l'utilisateur Firebase pour savoir si l'email vient d'être vérifié
   * (user.reload() mutant l'objet en place, on ne peut pas se fier au simple re-render). */
  refreshEmailVerified: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  role: null,
  isAdmin: false,
  isStaff: false,
  staffName: "",
  refreshStaffName: async () => {},
  loading: true,
  emailVerified: false,
  refreshEmailVerified: async () => false,
});

/** Nom du compte, sinon celui noté par l'équipe (roles.name), sinon celui du profil candidat. */
async function loadStaffName(user: User, roleName: unknown): Promise<string> {
  const known = staffDisplayName(user.displayName, typeof roleName === "string" ? roleName : "");
  if (known) return known;
  try {
    const profile = await getDoc(doc(db, "users", user.uid));
    return staffDisplayName(profile.data()?.fullName, user.email);
  } catch {
    return user.email || "";
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<StaffRole | null>(null);
  const [staffName, setStaffName] = useState("");
  const [loading, setLoading] = useState(true);
  const [emailVerified, setEmailVerified] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      // Repasse en "chargement" tant que le rôle n'est pas connu : sans ça,
      // juste après une connexion, la garde admin voyait un utilisateur
      // connecté sans rôle encore connu et le renvoyait à l'accueil.
      setLoading(true);
      setUser(firebaseUser);
      setEmailVerified(firebaseUser?.emailVerified ?? false);
      if (firebaseUser) {
        try {
          const roleSnap = await getDoc(doc(db, "roles", firebaseUser.uid));
          const data = roleSnap.data();
          const staffRole = isStaffRole(data?.role) ? data.role : null;
          setRole(staffRole);
          setStaffName(staffRole ? await loadStaffName(firebaseUser, data?.name) : "");
        } catch (err) {
          console.error("Lecture du rôle impossible :", err);
          setRole(null);
        }
      } else {
        setRole(null);
        setStaffName("");
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  async function refreshStaffName() {
    const current = auth.currentUser;
    if (!current || !role) return;
    const roleSnap = await getDoc(doc(db, "roles", current.uid)).catch(() => null);
    setStaffName(await loadStaffName(current, roleSnap?.data()?.name));
  }

  async function refreshEmailVerified(): Promise<boolean> {
    if (!auth.currentUser) return false;
    await auth.currentUser.reload();
    const verified = auth.currentUser.emailVerified;
    setEmailVerified(verified);
    return verified;
  }

  return (
    <AuthContext.Provider value={{
        user,
        role,
        isAdmin: role === "admin",
        isStaff: role !== null,
        staffName,
        refreshStaffName,
        loading,
        emailVerified,
        refreshEmailVerified,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
