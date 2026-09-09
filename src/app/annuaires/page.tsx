// src/app/annuaires/page.tsx
// Les 3 annuaires Sala (universités, entreprises, clubs d'anglais) — même
// modèle d'affichage partout : carte compacte (bandeau coloré, logo, type,
// ville, résumé) qui, au clic, ouvre le détail complet (description,
// filières/domaines/activités, carte de localisation + itinéraire).

"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppTopbar } from "@/components/layout/AppTopbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { FabCv } from "@/components/layout/FabCv";
import { Modal } from "@/components/Modal";
import { CompanyTile } from "@/components/CompanyTile";
import { Pagination } from "@/components/admin/Pagination";
import { usePagination } from "@/hooks/usePagination";
import { usePublicAnnuaires } from "@/hooks/usePublicAnnuaire";
import {
  annuaireAddress,
  annuaireBadgeLabel,
  annuaireCardSummary,
  annuaireCategoryClass,
  annuaireDetailChips,
  annuaireDirectionsUrl,
  annuaireMapEmbedUrl,
} from "@/lib/annuaire-helpers";
import type { AnnuaireCategory, AnnuaireItem } from "@/types/annuaire";

const TABS: { key: AnnuaireCategory; icon: string; label: string }[] = [
  { key: "universities", icon: "fas fa-graduation-cap", label: "Universités & Écoles" },
  { key: "companies", icon: "fas fa-building", label: "Entreprises & Recruteurs" },
  { key: "clubs", icon: "fas fa-comments", label: "Clubs d'Anglais" },
];

const CATEGORY_ICON: Record<AnnuaireCategory, string> = {
  universities: "fas fa-graduation-cap",
  companies: "fas fa-building",
  clubs: "fas fa-comments",
};

function splitCities(value?: string): string[] {
  return (value || "")
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);
}

function AnnuaireCard({
  category,
  item,
  index,
  onOpen,
}: {
  category: AnnuaireCategory;
  item: AnnuaireItem;
  index: number;
  onOpen: () => void;
}) {
  const cat = annuaireCategoryClass(category);
  const badge = annuaireBadgeLabel(category, item);
  const summary = annuaireCardSummary(item);

  return (
    <div
      className="annuaire-card annuaire-card-clickable annuaire-fade-in"
      style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
      onClick={onOpen}
      role="button"
      tabIndex={0}
    >
      <div className={`annuaire-card-banner annuaire-card-banner-${cat}`}>
        {item.verified && (
          <span className="annuaire-verified-badge" title="Partenaire vérifié Sala">
            <i className="fas fa-check"></i>
          </span>
        )}
      </div>
      <div className="annuaire-card-body">
        <div className="annuaire-card-logo-wrap">
          {item.logo ? (
            <CompanyTile company={item.name} logoUrl={item.logo} large />
          ) : (
            <div className={`card-icon-header icon-${cat}`}>
              <i className={CATEGORY_ICON[category]}></i>
            </div>
          )}
        </div>
        <span className={`annuaire-badge annuaire-badge-${cat}`}>{badge}</span>
        <h5 className="fw-bold mb-1 mt-2" style={{ fontSize: "1.05rem" }}>{item.name}</h5>
        <div className="text-muted small mb-2">
          <i className="fas fa-map-marker-alt text-success me-1"></i> {item.city || "—"}
        </div>
        {summary && <p className="text-secondary small mb-0 annuaire-card-summary">{summary}</p>}
      </div>
      <div className={`annuaire-card-cta cta-${cat}`}>
        Voir la fiche <i className="fas fa-arrow-right ms-1"></i>
      </div>
    </div>
  );
}

function AnnuaireCardSkeleton() {
  return (
    <div className="annuaire-card">
      <div className="annuaire-card-banner annuaire-skeleton-block"></div>
      <div className="annuaire-card-body">
        <div className="annuaire-skeleton-logo"></div>
        <div className="annuaire-skeleton-line" style={{ width: "45%" }}></div>
        <div className="annuaire-skeleton-line" style={{ width: "75%", height: 16 }}></div>
        <div className="annuaire-skeleton-line" style={{ width: "55%" }}></div>
        <div className="annuaire-skeleton-line" style={{ width: "95%" }}></div>
        <div className="annuaire-skeleton-line" style={{ width: "85%" }}></div>
      </div>
    </div>
  );
}

const VALID_CATEGORIES: AnnuaireCategory[] = ["universities", "companies", "clubs"];

function AnnuairesPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const catParam = searchParams.get("cat") as AnnuaireCategory | null;
  const initialCategory = catParam && VALID_CATEGORIES.includes(catParam) ? catParam : "universities";

  const { universities, companies, clubs, loading } = usePublicAnnuaires();
  const [category, setCategory] = useState<AnnuaireCategory>(initialCategory);
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("all");
  const [detailItem, setDetailItem] = useState<AnnuaireItem | null>(null);

  const items = category === "universities" ? universities : category === "companies" ? companies : clubs;
  const detailCat = annuaireCategoryClass(category);

  const cities = useMemo(() => {
    const set = new Set<string>();
    items.forEach((item) => splitCities(item.city).forEach((c) => set.add(c)));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [items]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter((item) => {
      const matchCity = city === "all" || splitCities(item.city).some((c) => c.toLowerCase() === city.toLowerCase());
      if (!matchCity) return false;
      if (!term) return true;
      return JSON.stringify(item).toLowerCase().includes(term);
    });
  }, [items, search, city]);

  const { pageItems, page, totalPages, setPage } = usePagination(filtered, `${category}|${city}|${search.trim().toLowerCase()}`);

  const detailChips = detailItem ? annuaireDetailChips(category, detailItem) : null;
  const detailMapUrl = detailItem ? annuaireMapEmbedUrl(detailItem) : null;
  const detailDirectionsUrl = detailItem ? annuaireDirectionsUrl(detailItem) : null;
  const detailAddress = detailItem ? annuaireAddress(detailItem) : "";

  return (
    <div className="sala-layout-wrapper">
      <AppSidebar />
      <div className="sala-main-content">
        <AppTopbar />

        <div className="container py-4">
          <div className="text-center mb-3">
            <span className="badge-sala-green px-3 py-1 mb-2">Réseau &amp; Écosystème Congolais</span>
            <h1 className="h2 fw-bold text-dark mb-2">Les Annuaires Sala</h1>
            <p className="text-muted" style={{ maxWidth: 600, margin: "0 auto" }}>
              Découvrez les établissements universitaires, les recruteurs partenaires et les clubs linguistiques au Congo.
            </p>
          </div>

          {!loading && (
            <div className="annuaire-stats-bar">
              <div className="annuaire-stat-tile stat-uni">
                <div className="num">{universities.length}</div>
                <div className="label">Universités &amp; Écoles</div>
              </div>
              <div className="annuaire-stat-tile stat-comp">
                <div className="num">{companies.length}</div>
                <div className="label">Entreprises partenaires</div>
              </div>
              <div className="annuaire-stat-tile stat-club">
                <div className="num">{clubs.length}</div>
                <div className="label">Clubs d&apos;anglais</div>
              </div>
            </div>
          )}

          <div className="annuaire-nav-tabs justify-content-center">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                className={`annuaire-tab-btn${category === tab.key ? ` active active-${annuaireCategoryClass(tab.key)}` : ""}`}
                onClick={() => {
                  setCategory(tab.key);
                  setCity("all");
                  router.replace(`/annuaires?cat=${tab.key}`, { scroll: false });
                }}
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
                {cities.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="row g-3">
            {loading &&
              Array.from({ length: 6 }).map((_, i) => (
                <div className="col-md-6 col-lg-4" key={i}>
                  <AnnuaireCardSkeleton />
                </div>
              ))}

            {!loading && filtered.length === 0 && (
              <div className="col-12 text-center py-5">
                <i className="fas fa-search fa-3x text-muted mb-3"></i>
                <h5 className="fw-bold">Aucun résultat trouvé</h5>
                <p className="text-muted">Essayez de modifier vos termes de recherche ou la ville sélectionnée.</p>
              </div>
            )}

            {!loading &&
              pageItems.map((item, i) => (
                <div className="col-md-6 col-lg-4" key={item.id}>
                  <AnnuaireCard category={category} item={item} index={i} onOpen={() => setDetailItem(item)} />
                </div>
              ))}
          </div>

          {!loading && filtered.length > 0 && (
            <Pagination
              page={page}
              totalPages={totalPages}
              onChange={(p) => {
                setPage(p);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          )}
        </div>
      </div>

      <Modal open={!!detailItem} onClose={() => setDetailItem(null)} title={detailItem?.name || "Détails"} size="md">
        {detailItem && (
          <>
            <div className={`annuaire-detail-header annuaire-detail-header-${detailCat}`}>
              <CompanyTile company={detailItem.name} logoUrl={detailItem.logo} large />
              <div>
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <span className={`annuaire-badge annuaire-badge-${detailCat}`}>{annuaireBadgeLabel(category, detailItem)}</span>
                  {detailItem.verified && (
                    <span className="annuaire-badge" style={{ background: "var(--sala-green-light)", color: "var(--sala-green-dark)" }}>
                      <i className="fas fa-check-circle"></i> Partenaire vérifié
                    </span>
                  )}
                </div>
                <div className="text-muted small mt-1">
                  <i className="fas fa-map-marker-alt text-success me-1"></i> {detailItem.city || "—"}
                  {detailAddress && <> — {detailAddress}</>}
                </div>
              </div>
            </div>

            {detailItem.description && (
              <p className="text-secondary small mb-3" style={{ lineHeight: 1.6 }}>{detailItem.description}</p>
            )}

            {detailChips && detailChips.items.length > 0 && (
              <div className="mb-3">
                <div className="annuaire-detail-section-title"><i className="fas fa-list-ul"></i> {detailChips.label}</div>
                <div className="d-flex flex-wrap gap-1">
                  {detailChips.items.map((chip, i) => (
                    <span className="badge bg-light text-dark border" style={{ fontSize: "0.75rem" }} key={i}>{chip}</span>
                  ))}
                </div>
              </div>
            )}

            {category === "clubs" && (detailItem.schedule || detailItem.fee) && (
              <div className="mb-3 d-flex flex-wrap gap-2">
                {detailItem.schedule && (
                  <span className="badge bg-light text-dark border p-2" style={{ fontSize: "0.8rem" }}>
                    <i className="far fa-clock me-1 text-danger"></i> {detailItem.schedule}
                  </span>
                )}
                {detailItem.fee && (
                  <span className="badge bg-warning-subtle text-dark border p-2" style={{ fontSize: "0.8rem" }}>
                    <i className="fas fa-tag me-1"></i> {detailItem.fee}
                  </span>
                )}
              </div>
            )}

            {detailMapUrl && (
              <div className="mb-2">
                <div className="annuaire-detail-section-title"><i className="fas fa-map-marked-alt"></i> Localisation</div>
                <div className="annuaire-map-frame mb-2">
                  <iframe
                    src={detailMapUrl}
                    title={`Localisation - ${detailItem.name}`}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  ></iframe>
                </div>
                {detailDirectionsUrl && (
                  <a href={detailDirectionsUrl} target="_blank" rel="noopener" className="btn btn-sm btn-outline-secondary rounded-pill">
                    <i className="fas fa-diamond-turn-right me-1"></i> Itinéraire
                  </a>
                )}
              </div>
            )}

            <div className="d-flex flex-wrap gap-2 pt-3 mt-2 border-top">
              {detailItem.phone && (
                <a href={`tel:${detailItem.phone}`} className="btn btn-sm btn-outline-success rounded-pill">
                  <i className="fas fa-phone-alt me-1"></i> Appeler
                </a>
              )}
              {detailItem.email && (
                <a href={`mailto:${detailItem.email}`} className="btn btn-sm btn-outline-primary rounded-pill">
                  <i className="fas fa-envelope me-1"></i> {category === "companies" ? "Contact RH" : "Email"}
                </a>
              )}
              {detailItem.website && (
                <a href={detailItem.website} target="_blank" rel="noopener" className="btn btn-sm btn-sala-primary rounded-pill">
                  <i className="fas fa-globe me-1"></i> Site Web
                </a>
              )}
              {category === "clubs" && detailItem.coordinator && (
                <span className="btn btn-sm btn-light rounded-pill disabled">
                  <i className="fas fa-user me-1"></i> {detailItem.coordinator}
                </span>
              )}
            </div>
          </>
        )}
      </Modal>

      <FabCv />
      <BottomNav />
    </div>
  );
}

export default function AnnuairesPage() {
  return (
    <Suspense fallback={null}>
      <AnnuairesPageInner />
    </Suspense>
  );
}
