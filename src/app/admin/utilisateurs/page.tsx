// src/app/admin/utilisateurs/page.tsx
// Comptes candidats inscrits ; promouvoir un compte donne accès au back-office.

"use client";

import { useState } from "react";
import { useUsersAdmin } from "@/hooks/useUsersAdmin";
import { CompanyTile } from "@/components/CompanyTile";
import { confirmAction, notify } from "@/lib/notify";
import type { UserProfile } from "@/types/user-profile";

export default function AdminUsersPage() {
  const { users, adminUids, loading, promote, demote } = useUsersAdmin();
  const [search, setSearch] = useState("");

  const term = search.trim().toLowerCase();
  const filtered = users.filter((u) => !term || [u.fullName, u.email, u.city].some((v) => (v || "").toLowerCase().includes(term)));

  async function handleToggleAdmin(user: UserProfile) {
    const isAdmin = adminUids.has(user.id);
    const label = user.fullName || user.email || "cet utilisateur";
    const confirmed = isAdmin
      ? await confirmAction("Confirmer", `Retirer les droits administrateur de « ${label} » ?`, "#e30613")
      : await confirmAction("Confirmer", `Donner les droits administrateur (accès complet à ce tableau de bord) à « ${label} » ?`);

    if (!confirmed) return;

    try {
      if (isAdmin) {
        await demote(user.id);
        notify("Droits administrateur retirés.");
      } else {
        await promote(user.id);
        notify("Utilisateur promu administrateur.");
      }
    } catch (err) {
      console.error("Erreur mise à jour du rôle :", err);
      notify("Erreur : " + (err as Error).message, "error");
    }
  }

  return (
    <section>
      <div className="admin-section-header">
        <div>
          <h1 className="admin-page-title">Utilisateurs</h1>
          <p className="admin-page-subtitle">Comptes candidats inscrits. Promouvoir un compte donne accès à ce tableau de bord.</p>
        </div>
      </div>

      <div className="admin-toolbar">
        <div className="admin-search-wrap">
          <i className="fas fa-search"></i>
          <input
            type="text"
            className="admin-search-input"
            placeholder="Rechercher par nom, email, ville..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="admin-card-grid">
        {loading && (
          <div className="admin-card-empty admin-empty">
            <div className="spinner-border text-success"></div>
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="admin-card-empty admin-empty">
            {users.length === 0 ? "Aucun compte candidat inscrit pour le moment." : "Aucun utilisateur ne correspond à votre recherche."}
          </div>
        )}

        {!loading &&
          filtered.map((u) => {
            const isAdmin = adminUids.has(u.id);
            const joined = u.createdAt?.toDate ? u.createdAt.toDate().toLocaleDateString("fr-FR") : "—";
            return (
              <div className="admin-card" key={u.id}>
                <div className="admin-card-top">
                  <div className="admin-row-identity">
                    <CompanyTile company={u.fullName || u.email} />
                    <div>
                      <div className="title">{u.fullName || "Candidat Sala"}</div>
                      <div className="subtitle">{u.email || ""}</div>
                    </div>
                  </div>
                  {isAdmin && (
                    <span className="admin-badge" style={{ background: "var(--sala-red-light)", color: "var(--sala-red)" }}>
                      Admin
                    </span>
                  )}
                </div>
                <div className="admin-card-meta">
                  <span><i className="fas fa-map-marker-alt"></i>{u.city || "—"}</span>
                  <span><i className="far fa-calendar"></i>Inscrit le {joined}</span>
                </div>
                <div className="admin-card-footer">
                  <span className="text-muted small">{(u.skills || []).length} compétence(s)</span>
                  <button
                    className={`btn-icon ${isAdmin ? "btn-icon-delete" : "btn-icon-edit"}`}
                    title={isAdmin ? "Retirer les droits admin" : "Promouvoir en admin"}
                    onClick={() => handleToggleAdmin(u)}
                  >
                    <i className={`fas ${isAdmin ? "fa-user-minus" : "fa-user-shield"}`}></i>
                  </button>
                </div>
              </div>
            );
          })}
      </div>
    </section>
  );
}
