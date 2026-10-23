// src/hooks/useUsersAdmin.ts
// Comptes candidats (collection "users") et l'ensemble des UID admin
// (collection "roles"), rechargés à la demande (refresh()) après une
// promotion/rétrogradation.

"use client";

import { useCallback, useEffect, useState } from "react";
import { collection, deleteDoc, doc, getDocs, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { UserProfile, UserProfileDoc } from "@/types/user-profile";
import { logAdminAction } from "@/lib/admin-log";

export function useUsersAdmin() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [adminUids, setAdminUids] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [usersSnap, rolesSnap] = await Promise.all([getDocs(collection(db, "users")), getDocs(collection(db, "roles"))]);
      setUsers(usersSnap.docs.map((d) => ({ id: d.id, ...(d.data() as UserProfileDoc) })));
      setAdminUids(new Set(rolesSnap.docs.filter((d) => d.data().role === "admin").map((d) => d.id)));
    } catch (err) {
      console.error("Erreur chargement utilisateurs :", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  function userLabel(uid: string): string {
    const u = users.find((x) => x.id === uid);
    return u?.fullName || u?.email || uid;
  }

  async function promote(uid: string) {
    await setDoc(doc(db, "roles", uid), { role: "admin" });
    await logAdminAction("promote", "roles", userLabel(uid), uid);
    setAdminUids((prev) => new Set(prev).add(uid));
  }

  async function demote(uid: string) {
    await deleteDoc(doc(db, "roles", uid));
    await logAdminAction("demote", "roles", userLabel(uid), uid);
    setAdminUids((prev) => {
      const next = new Set(prev);
      next.delete(uid);
      return next;
    });
  }

  return { users, adminUids, loading, refresh, promote, demote };
}
