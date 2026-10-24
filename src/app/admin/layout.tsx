// src/app/admin/layout.tsx
// Garde d'accès admin + coquille du back-office (sidebar, topbar, onglets
// mobiles) partagée par toutes les sections /admin/*.
// Si l'équipe a rendu la double authentification obligatoire (voir
// src/lib/mfa.ts), un admin sans application configurée doit le faire avant
// d'entrer, et une session ouverte sans le code doit être rouverte.

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { MfaEnrollment } from "@/components/admin/MfaEnrollment";
import { hasTotp, loadSecurityPolicy, sessionUsedSecondFactor } from "@/lib/mfa";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { AdminMobileTabs } from "@/components/admin/AdminMobileTabs";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();
  // "ok" : accès libre ; "enroll" : configurer l'application ; "relogin" : se reconnecter avec le code.
  const [mfaGate, setMfaGate] = useState<"checking" | "ok" | "enroll" | "relogin">("checking");
  const [mfaCheck, setMfaCheck] = useState(0);

  useEffect(() => {
    if (loading || !user || !isAdmin) return;
    let cancelled = false;
    (async () => {
      const { adminMfaRequired } = await loadSecurityPolicy();
      let gate: "ok" | "enroll" | "relogin" = "ok";
      if (adminMfaRequired) {
        if (!hasTotp(user)) gate = "enroll";
        else if (!(await sessionUsedSecondFactor(user))) gate = "relogin";
      }
      if (!cancelled) setMfaGate(gate);
    })();
    return () => {
      cancelled = true;
    };
  }, [loading, user, isAdmin, mfaCheck]);

  async function relogin() {
    await signOut(auth);
    router.replace("/connexion");
  }

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

  if (loading || !user || !isAdmin || mfaGate === "checking") {
    return (
      <div className="admin-auth-checking">
        <div className="spinner-border text-success"></div>
        <p>Vérification de vos droits administrateur...</p>
      </div>
    );
  }

  if (mfaGate !== "ok") {
    return (
      <div className="auth-page-bg">
        <div className="admin-panel" style={{ maxWidth: 520, margin: "40px auto" }}>
          <h2><i className="fas fa-shield-alt me-2"></i>Double authentification obligatoire</h2>
          {mfaGate === "enroll" ? (
            <>
              <p className="small mb-3">
                L&apos;équipe Sala protège le back-office par un code à 6 chiffres en plus du mot de passe. Configurez-la une fois pour votre compte ({user.email}).
              </p>
              <MfaEnrollment user={user} onDone={() => setMfaCheck((n) => n + 1)} />
            </>
          ) : (
            <p className="small mb-3">
              Votre application est bien configurée. Reconnectez-vous en saisissant le code qu&apos;elle affiche pour accéder au back-office.
            </p>
          )}
          <button className={`btn ${mfaGate === "relogin" ? "btn-success" : "btn-link"} rounded-pill mt-3`} onClick={relogin}>
            {mfaGate === "relogin" ? "Me reconnecter" : "Se déconnecter"}
          </button>
        </div>
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
