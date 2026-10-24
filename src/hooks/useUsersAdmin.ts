// src/hooks/useUsersAdmin.ts
// Comptes candidats (collection "users") et le rôle de ceux qui font partie
// de l'équipe (collection "roles"), pour les signaler dans la liste. L'équipe
// elle-même se gère dans Admin > Équipe (voir useTeam.ts).

"use client";

import { useCallback, useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { UserProfile, UserProfileDoc } from "@/types/user-profile";
import { isStaffRole, type StaffRole } from "@/lib/staff-roles";

export function useUsersAdmin() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [staffRoles, setStaffRoles] = useState<Map<string, StaffRole>>(new Map());
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [usersSnap, rolesSnap] = await Promise.all([getDocs(collection(db, "users")), getDocs(collection(db, "roles"))]);
      setUsers(usersSnap.docs.map((d) => ({ id: d.id, ...(d.data() as UserProfileDoc) })));
      const roles = new Map<string, StaffRole>();
      rolesSnap.docs.forEach((d) => {
        const role = d.data().role;
        if (isStaffRole(role)) roles.set(d.id, role);
      });
      setStaffRoles(roles);
    } catch (err) {
      console.error("Erreur chargement utilisateurs :", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { users, staffRoles, loading, refresh };
}
