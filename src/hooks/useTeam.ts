// src/hooks/useTeam.ts
// Équipe du back-office (Admin > Équipe), lue et modifiée via
// /api/admin/team : la création de comptes et la lecture des e-mails et de
// la double authentification demandent le compte de service, côté serveur.

"use client";

import { useCallback, useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import type { StaffRole, TeamMember } from "@/lib/staff-roles";

interface ApiResult {
  ok: boolean;
  error?: string;
  members?: TeamMember[];
  created?: boolean;
  changed?: boolean;
}

async function callApi(path: string, method: "GET" | "POST", body?: object): Promise<ApiResult> {
  const idToken = await auth.currentUser?.getIdToken();
  const res = await fetch(path, {
    method,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken || ""}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = (await res.json().catch(() => null)) as ApiResult | null;
  if (!data?.ok) throw new Error(data?.error || "Opération impossible pour le moment.");
  return data;
}

export function useTeam() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const data = await callApi("/api/admin/team", "GET");
      setMembers(data.members || []);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /** Renvoie true si un nouveau compte a été créé (il faut alors l'inviter à choisir son mot de passe). */
  async function addMember(email: string, name: string, role: StaffRole): Promise<boolean> {
    const data = await callApi("/api/admin/team", "POST", { action: "add", email, name, role });
    await refresh();
    return !!data.created;
  }

  async function updateMember(uid: string, changes: { role?: StaffRole; name?: string }) {
    await callApi("/api/admin/team", "POST", { action: "update", uid, ...changes });
    await refresh();
  }

  async function removeMember(uid: string) {
    await callApi("/api/admin/team", "POST", { action: "remove", uid });
    await refresh();
  }

  /** Retire la double authentification d'un membre qui a perdu son téléphone. */
  async function resetMfa(email: string): Promise<boolean> {
    const data = await callApi("/api/admin/mfa", "POST", { action: "reset", email });
    await refresh();
    return !!data.changed;
  }

  return { members, loading, error, addMember, updateMember, removeMember, resetMfa };
}
