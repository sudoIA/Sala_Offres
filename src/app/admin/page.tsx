// src/app/admin/page.tsx
// Vue d'ensemble : statistiques globales + actions rapides.

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAdminJobs } from "@/hooks/useAdminJobs";
import { useEvents } from "@/hooks/useEvents";
import { useLegislationAdmin } from "@/hooks/useLegislationAdmin";
import { useUsersAdmin } from "@/hooks/useUsersAdmin";

export default function AdminOverviewPage() {
  const router = useRouter();
  const { jobs } = useAdminJobs();
  const { events } = useEvents();
  const { fiches } = useLegislationAdmin();
  const { users } = useUsersAdmin();
  const [annuaireCount, setAnnuaireCount] = useState<string | number>("—");

  useEffect(() => {
    Promise.all([
      getDocs(collection(db, "universites")),
      getDocs(collection(db, "entreprises")),
      getDocs(collection(db, "clubs_anglais")),
    ])
      .then(([uni, comp, club]) => setAnnuaireCount(uni.size + comp.size + club.size))
      .catch((err) => {
        console.error("Erreur comptage annuaires :", err);
        setAnnuaireCount("—");
      });
  }, []);

  const now = new Date();
  const visibleJobs = jobs.filter((j) => {
    const deadline = j.deadlineDate;
    return j.visibility !== false && (!deadline || deadline > now);
  });

  return (
    <section>
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "var(--sala-green-light)", color: "var(--sala-green-dark)" }}>
            <i className="fas fa-briefcase"></i>
          </div>
          <div>
            <div className="stat-value">{visibleJobs.length}</div>
            <div className="stat-label">Offres visibles publiquement</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "var(--sala-bg)", color: "var(--sala-text-secondary)" }}>
            <i className="fas fa-layer-group"></i>
          </div>
          <div>
            <div className="stat-value">{jobs.length}</div>
            <div className="stat-label">Offres au total (tous statuts)</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#e0f2fe", color: "#0284c7" }}>
            <i className="fas fa-calendar-alt"></i>
          </div>
          <div>
            <div className="stat-value">{events.length}</div>
            <div className="stat-label">Événements publiés</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#f3e8ff", color: "#7e22ce" }}>
            <i className="fas fa-address-book"></i>
          </div>
          <div>
            <div className="stat-value">{annuaireCount}</div>
            <div className="stat-label">Fiches annuaires (3 catégories)</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#fee2e2", color: "#b9050f" }}>
            <i className="fas fa-balance-scale"></i>
          </div>
          <div>
            <div className="stat-value">{fiches.length}</div>
            <div className="stat-label">Fiches Droit du Travail</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#fefce8", color: "#b45309" }}>
            <i className="fas fa-users"></i>
          </div>
          <div>
            <div className="stat-value">{users.length}</div>
            <div className="stat-label">Comptes candidats inscrits</div>
          </div>
        </div>
      </div>

      <div className="admin-panel">
        <h2>Actions rapides</h2>
        <div className="quick-actions">
          <button className="btn-sala-primary" onClick={() => router.push("/admin/offres?new=1")}>
            <i className="fas fa-plus"></i> Nouvelle offre d&apos;emploi
          </button>
          <button className="btn-sala-outline" onClick={() => router.push("/admin/evenements?new=1")}>
            <i className="fas fa-plus"></i> Ajouter un événement
          </button>
          <button className="btn-sala-outline" onClick={() => router.push("/admin/annuaires?new=1")}>
            <i className="fas fa-plus"></i> Ajouter une fiche annuaire
          </button>
          <button className="btn-sala-outline" onClick={() => router.push("/admin/legislation?new=1")}>
            <i className="fas fa-plus"></i> Ajouter une fiche Droit du Travail
          </button>
        </div>
      </div>
    </section>
  );
}
