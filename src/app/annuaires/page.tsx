// src/app/annuaires/page.tsx
// Les 3 annuaires Sala (universités, entreprises, clubs d'anglais) — onglets,
// recherche, filtre ville.

"use client";

import { useMemo, useState } from "react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppTopbar } from "@/components/layout/AppTopbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { FabCv } from "@/components/layout/FabCv";
import { usePublicAnnuaires } from "@/hooks/usePublicAnnuaire";
import type { AnnuaireCategory, AnnuaireItem } from "@/types/annuaire";

const TABS: { key: AnnuaireCategory; icon: string; label: string }[] = [
  { key: "universities", icon: "fas fa-graduation-cap", label: "Universités & Écoles" },
  { key: "companies", icon: "fas fa-building", label: "Entreprises & Recruteurs" },
  { key: "clubs", icon: "fas fa-comments", label: "Clubs d'Anglais" },
];

function UniversityCard({ item }: { item: AnnuaireItem }) {
  return (
    <div className="annuaire-card">
      <div>
        <div className="d-flex align-items-center gap-3 mb-3">
          <div className="card-icon-header icon-uni"><i className="fas fa-graduation-cap"></i></div>
          <div>
            <span className="badge-sala-green">{item.type || "Enseignement Supérieur"}</span>
            <h5 className="fw-bold mb-0 mt-1" style={{ fontSize: "1.05rem" }}>{item.name}</h5>
          </div>
        </div>
        <div className="text-muted small mb-2"><i className="fas fa-map-marker-alt text-success me-1"></i> {item.city} — {item.address || ""}</div>
        <div className="mb-3">
          <div className="small fw-bold text-dark mb-1">Filières &amp; Départements :</div>
          <div className="d-flex flex-wrap gap-1">
            {(item.faculties || []).map((f, i) => (
              <span className="badge bg-light text-dark border" style={{ fontSize: "0.75rem" }} key={i}>{f}</span>
            ))}
          </div>
        </div>
      </div>
      <div className="pt-3 border-top d-flex gap-2 justify-content-between align-items-center">
        {item.phone ? (
          <a href={`tel:${item.phone}`} className="btn btn-sm btn-outline-success rounded-pill"><i className="fas fa-phone-alt me-1"></i> Appeler</a>
        ) : (
          <span></span>
        )}
        {item.website && (
          <a href={item.website} target="_blank" rel="noopener" className="btn btn-sm btn-sala-primary rounded-pill"><i className="fas fa-globe me-1"></i> Site Web</a>
        )}
      </div>
    </div>
  );
}

function CompanyCard({ item }: { item: AnnuaireItem }) {
  return (
    <div className="annuaire-card">
      <div>
        <div className="d-flex align-items-center gap-3 mb-3">
          <div className="card-icon-header icon-comp"><i className="fas fa-building"></i></div>
          <div>
            <span className="badge bg-primary-subtle text-primary fw-bold" style={{ fontSize: "0.75rem" }}>{item.sector}</span>
            <h5 className="fw-bold mb-0 mt-1" style={{ fontSize: "1.05rem" }}>{item.name}</h5>
          </div>
        </div>
        <div className="text-muted small mb-2"><i className="fas fa-map-marker-alt text-primary me-1"></i> {item.city}</div>
        <p className="text-secondary small mb-3" style={{ lineHeight: 1.5 }}>{item.description || ""}</p>
      </div>
      <div className="pt-3 border-top d-flex gap-2 justify-content-between align-items-center">
        {item.email ? (
          <a href={`mailto:${item.email}`} className="btn btn-sm btn-outline-primary rounded-pill"><i className="fas fa-envelope me-1"></i> Contact RH</a>
        ) : (
          <span></span>
        )}
        {item.website && (
          <a href={item.website} target="_blank" rel="noopener" className="btn btn-sm btn-primary rounded-pill"><i className="fas fa-external-link-alt me-1"></i> Découvrir</a>
        )}
      </div>
    </div>
  );
}

function ClubCard({ item }: { item: AnnuaireItem }) {
  return (
    <div className="annuaire-card">
      <div>
        <div className="d-flex align-items-center gap-3 mb-3">
          <div className="card-icon-header icon-club"><i className="fas fa-comments"></i></div>
          <div>
            <span className="badge bg-warning-subtle text-dark fw-bold" style={{ fontSize: "0.75rem" }}>{item.fee || "Club Ouvert"}</span>
            <h5 className="fw-bold mb-0 mt-1" style={{ fontSize: "1.05rem" }}>{item.name}</h5>
          </div>
        </div>
        <div className="text-muted small mb-2"><i className="fas fa-map-marker-alt text-warning me-1"></i> {item.city} — {item.location}</div>
        <div className="badge bg-light text-dark border p-2 mb-2 w-100 text-start">
          <i className="far fa-clock me-1 text-danger"></i> {item.schedule}
        </div>
        <p className="text-secondary small mb-3">{item.description}</p>
      </div>
      <div className="pt-3 border-top d-flex gap-2 justify-content-between align-items-center">
        {item.phone && (
          <a href={`tel:${item.phone}`} className="btn btn-sm btn-outline-warning text-dark rounded-pill">
            <i className="fas fa-phone-alt me-1"></i> Contacter ({item.coordinator || "Coord"})
          </a>
        )}
      </div>
    </div>
  );
}

export default function AnnuairesPage() {
  const { universities, companies, clubs, loading } = usePublicAnnuaires();
  const [category, setCategory] = useState<AnnuaireCategory>("universities");
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("all");

  const items = category === "universities" ? universities : category === "companies" ? companies : clubs;

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter((item) => {
      const matchCity = city === "all" || (item.city && item.city.toLowerCase() === city.toLowerCase());
      if (!matchCity) return false;
      if (!term) return true;
      return JSON.stringify(item).toLowerCase().includes(term);
    });
  }, [items, search, city]);

  return (
    <div className="sala-layout-wrapper">
      <AppSidebar />
      <div className="sala-main-content">
        <AppTopbar />

        <div className="container py-4">
          <div className="text-center mb-4">
            <span className="badge-sala-green px-3 py-1 mb-2">Réseau &amp; Écosystème Congolais</span>
            <h1 className="h2 fw-bold text-dark mb-2">Les Annuaires Sala</h1>
            <p className="text-muted" style={{ maxWidth: 600, margin: "0 auto" }}>
              Découvrez les établissements universitaires, les recruteurs partenaires et les clubs linguistiques au Congo.
            </p>
          </div>

          <div className="annuaire-nav-tabs justify-content-center">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                className={`annuaire-tab-btn${category === tab.key ? " active" : ""}`}
                onClick={() => setCategory(tab.key)}
              >
                <i className={tab.icon}></i> {tab.label}
              </button>
            ))}
          </div>

          <div className="row g-2 mb-4 align-items-center" style={{ maxWidth: 780, margin: "0 auto" }}>
            <div className="col-sm-8">
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0"><i className="fas fa-search text-muted"></i></span>
                <input
                  type="text"
                  className="form-control border-start-0 ps-0"
                  placeholder="Rechercher par nom, filière ou secteur..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="col-sm-4">
              <select className="form-select" value={city} onChange={(e) => setCity(e.target.value)}>
                <option value="all">Toutes les villes</option>
                <option value="Brazzaville">Brazzaville</option>
                <option value="Pointe-Noire">Pointe-Noire</option>
                <option value="Kintélé">Kintélé</option>
              </select>
            </div>
          </div>

          <div className="row g-3">
            {loading && (
              <div className="col-12 text-center py-5">
                <div className="spinner-border text-success" role="status"></div>
                <p className="text-muted mt-2">Chargement de l&apos;annuaire...</p>
              </div>
            )}

            {!loading && filtered.length === 0 && (
              <div className="col-12 text-center py-5">
                <i className="fas fa-search fa-3x text-muted mb-3"></i>
                <h5 className="fw-bold">Aucun résultat trouvé</h5>
                <p className="text-muted">Essayez de modifier vos termes de recherche ou la ville sélectionnée.</p>
              </div>
            )}

            {!loading &&
              filtered.map((item) => (
                <div className="col-md-6 col-lg-4" key={item.id}>
                  {category === "universities" && <UniversityCard item={item} />}
                  {category === "companies" && <CompanyCard item={item} />}
                  {category === "clubs" && <ClubCard item={item} />}
                </div>
              ))}
          </div>
        </div>
      </div>

      <FabCv />
      <BottomNav />
    </div>
  );
}
