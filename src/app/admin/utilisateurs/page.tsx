// src/app/admin/utilisateurs/page.tsx
// Comptes candidats inscrits. Les membres de l'équipe y sont signalés par
// leur rôle ; l'accès au back-office se donne dans Admin > Équipe.

"use client";

import { useState } from "react";
import Link from "next/link";
import { useUsersAdmin } from "@/hooks/useUsersAdmin";
import { CompanyTile } from "@/components/CompanyTile";
import { ROLE_INFO } from "@/lib/staff-roles";

export default function AdminUsersPage() {
  const { users, staffRoles, loading } = useUsersAdmin();
  const [search, setSearch] = useState("");

  const term = search.trim().toLowerCase();
  const filtered = users.filter((u) => !term || [u.fullName, u.email, u.city].some((v) => (v || "").toLowerCase().includes(term)));

  return (
    <section>
      <div className="admin-section-header">
        <div>
          <h1 className="admin-page-title">Utilisateurs</h1>
          <p className="admin-page-subtitle">
            Comptes candidats inscrits. Pour donner accès au back-office à quelqu&apos;un, passez par <Link href="/admin/equipe">Équipe</Link>.
          </p>
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
            const role = staffRoles.get(u.id);
            const joined = u.createdAt?.toDate ? u.createdAt.toDate().toLocaleDateString("fr-FR") : "-";
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
                  {role && (
                    <span className="admin-badge" style={{ background: "var(--sala-red-light)", color: "var(--sala-red)" }}>
                      {ROLE_INFO[role].label}
                    </span>
                  )}
                </div>
                <div className="admin-card-meta">
                  <span><i className="fas fa-map-marker-alt"></i>{u.city || "-"}</span>
                  <span><i className="far fa-calendar"></i>Inscrit le {joined}</span>
                </div>
                <div className="admin-card-footer">
                  <span className="text-muted small">{(u.skills || []).length} compétence(s)</span>
                </div>
              </div>
            );
          })}
      </div>
    </section>
  );
}
