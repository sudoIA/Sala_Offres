// src/app/admin/layout.tsx
// Garde d'accès admin + coquille du back-office (sidebar, topbar, onglets
// mobiles) partagée par toutes les sections /admin/*.

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { AdminMobileTabs } from "@/components/admin/AdminMobileTabs";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/connexion");
      return;
    }
    if (!isAdmin) {
      alert("Accès refusé. Réservé aux administrateurs de l'ONG Sala.");
      router.replace("/");
    }
  }, [loading, user, isAdmin, router]);

  if (loading || !user || !isAdmin) {
    return (
      <div className="admin-auth-checking">
        <div className="spinner-border text-success"></div>
        <p>Vérification de vos droits administrateur...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-body">
      <div className="sala-layout-wrapper">
        <AdminSidebar />
        <div className="sala-main-content">
          <AdminTopbar />
          <AdminMobileTabs />
          <main className="admin-main">{children}</main>
        </div>
      </div>
    </div>
  );
}
