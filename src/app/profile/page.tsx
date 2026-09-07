// src/app/profile/page.tsx
// Profil candidat : à propos, CV enregistrés, candidatures, favoris.

"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { FabCv } from "@/components/layout/FabCv";
import { EditProfileModal } from "@/components/profile/EditProfileModal";
import { loadUserProfile, logoutUser, updateUserProfile, type ProfileUpdateData } from "@/lib/candidate-profile";
import type { UserProfile } from "@/types/user-profile";

type Tab = "about" | "cv" | "applications" | "favorites";

const TABS: { key: Tab; label: string }[] = [
  { key: "about", label: "À propos" },
  { key: "cv", label: "CV enregistrés" },
  { key: "applications", label: "Mes candidatures" },
  { key: "favorites", label: "Favoris" },
];

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [tab, setTab] = useState<Tab>("about");
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/auth");
      return;
    }
    loadUserProfile(user.uid).then(setProfile);
  }, [authLoading, user, router]);

  async function handleSave(data: ProfileUpdateData) {
    if (!user) return;
    await updateUserProfile(user.uid, data);
    setProfile((p) => (p ? { ...p, ...data } : p));
  }

  if (authLoading || !user) {
    return (
      <div className="admin-auth-checking">
        <div className="spinner-border text-success"></div>
        <p>Chargement de votre profil...</p>
      </div>
    );
  }

  const displayName = profile?.fullName || user.displayName || "Candidat Sala";
  const avatarSrc = profile?.photoURL || user.photoURL || "/img/logo_100.png";

  return (
    <div className="sala-layout-wrapper">
      <AppSidebar />
      <div className="sala-main-content">
        <header className="sala-topbar">
          <Link href="/" className="d-flex align-items-center text-decoration-none">
            <Image src="/img/logo_transparent.png" alt="Logo Sala" width={100} height={38} style={{ height: 38, width: "auto" }} className="me-2" />
            <span style={{ fontWeight: 800, fontSize: "1.25rem", color: "var(--sala-green)" }}>SALA</span>
          </Link>
          <div className="d-flex align-items-center gap-2">
            <Link href="/offres" className="btn-sala-outline py-1 px-3" style={{ fontSize: "0.85rem" }}>
              <i className="fas fa-briefcase me-1"></i> Offres
            </Link>
            <button className="btn btn-outline-danger btn-sm rounded-pill px-3" onClick={() => logoutUser().then(() => router.push("/"))}>
              <i className="fas fa-sign-out-alt me-1"></i> Déconnexion
            </button>
          </div>
        </header>

        <div className="container py-4" style={{ maxWidth: 920 }}>
          <div className="profile-card">
            <div className="profile-banner"></div>

            <div className="d-flex justify-content-between align-items-end flex-wrap pe-4">
              <div className="profile-avatar-wrapper">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={avatarSrc} className="profile-avatar" alt="Photo de profil" />
              </div>
              <div className="mb-3 ms-auto pe-2">
                <button className="btn-sala-outline btn-sm" onClick={() => setModalOpen(true)}>
                  <i className="fas fa-pen me-1"></i> Modifier le profil
                </button>
              </div>
            </div>

            <div className="px-4 pb-3">
              <h2 className="h4 fw-bold mb-1">{displayName}</h2>
              <div className="d-flex flex-wrap gap-3 text-muted small mt-2">
                <span><i className="fas fa-envelope text-success me-1"></i> {profile?.email || user.email}</span>
                <span><i className="fas fa-map-marker-alt text-success me-1"></i> {profile?.city || "Brazzaville"}</span>
                <span><i className="fas fa-phone text-success me-1"></i> {profile?.phone || "Non renseigné"}</span>
              </div>
            </div>

            <div className="profile-tab-nav">
              {TABS.map((t) => (
                <button key={t.key} className={`profile-tab-link${tab === t.key ? " active" : ""}`} onClick={() => setTab(t.key)}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="profile-card p-4">
            {tab === "about" && (
              <div>
                <h5 className="fw-bold mb-3">Objectif professionnel &amp; Bio</h5>
                <p className="text-secondary" style={{ lineHeight: 1.6 }}>
                  {profile?.bio || 'Aucune bio renseignée pour le moment. Cliquez sur "Modifier le profil" pour vous présenter aux recruteurs.'}
                </p>

                <hr className="my-4" />

                <h5 className="fw-bold mb-3">Compétences clés</h5>
                <div className="d-flex flex-wrap">
                  {profile?.skills && profile.skills.length > 0 ? (
                    profile.skills.map((s, i) => (
                      <span className="skill-badge" key={i}><i className="fas fa-check-circle"></i> {s}</span>
                    ))
                  ) : (
                    <span className="text-muted small">Aucune compétence listée</span>
                  )}
                </div>

                <hr className="my-4" />

                <h5 className="fw-bold mb-3">CV par défaut</h5>
                <div className="d-flex align-items-center justify-content-between p-3 rounded-3" style={{ backgroundColor: "#f8f9fa", border: "1px solid var(--sala-border)" }}>
                  <div className="d-flex align-items-center gap-3">
                    <div style={{ width: 44, height: 44, background: "#fee2e2", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <i className="fas fa-file-pdf text-danger fa-lg"></i>
                    </div>
                    <div>
                      <div className="fw-bold">Mon CV Sala</div>
                      <small className="text-muted">Prêt à être envoyé aux recruteurs</small>
                    </div>
                  </div>
                  <Link href="/cv-builder" className="btn-sala-primary btn-sm">
                    <i className="fas fa-magic me-1"></i> Créer / Mettre à jour
                  </Link>
                </div>
              </div>
            )}

            {tab === "cv" && (
              <div>
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h5 className="fw-bold mb-0">Mes CVs professionnels</h5>
                  <Link href="/cv-builder" className="btn-sala-accent btn-sm">
                    <i className="fas fa-plus me-1"></i> Nouveau CV
                  </Link>
                </div>
                <div className="text-center py-4 text-muted">
                  <i className="fas fa-file-invoice fa-3x text-muted mb-3" style={{ opacity: 0.5 }}></i>
                  <p className="mb-2">Vous n&apos;avez pas encore généré de CV en ligne.</p>
                  <Link href="/cv-builder" className="btn-sala-primary btn-sm mt-1">Lancer le Générateur de CV</Link>
                </div>
              </div>
            )}

            {tab === "applications" && (
              <div>
                <h5 className="fw-bold mb-3">Historique des candidatures</h5>
                <div className="text-center py-4 text-muted">
                  <i className="fas fa-paper-plane fa-3x text-muted mb-3" style={{ opacity: 0.5 }}></i>
                  <p className="mb-2">Aucune candidature envoyée via Sala pour l&apos;instant.</p>
                  <Link href="/offres" className="btn-sala-outline btn-sm mt-1">Explorer les offres disponibles</Link>
                </div>
              </div>
            )}

            {tab === "favorites" && (
              <div>
                <h5 className="fw-bold mb-3">Offres sauvegardées</h5>
                <div className="text-center py-4 text-muted">
                  <i className="fas fa-bookmark fa-3x text-muted mb-3" style={{ opacity: 0.5 }}></i>
                  <p className="mb-2">Vous n&apos;avez pas encore d&apos;offres en favoris.</p>
                  <Link href="/offres" className="btn-sala-outline btn-sm mt-1">Découvrir les offres</Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <EditProfileModal open={modalOpen} profile={profile} onClose={() => setModalOpen(false)} onSave={handleSave} />

      <FabCv />
      <BottomNav />
    </div>
  );
}
