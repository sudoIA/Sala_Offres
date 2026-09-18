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
import { AnnuaireCard, AnnuaireCardSkeleton } from "@/components/annuaire/AnnuaireCard";
import { AnnuaireDetailContent } from "@/components/annuaire/AnnuaireDetailContent";
import { Pagination } from "@/components/admin/Pagination";
import { usePagination } from "@/hooks/usePagination";
import { usePublicAnnuaires } from "@/hooks/usePublicAnnuaire";
import { annuaireCategoryClass, annuaireModalTitle } from "@/lib/annuaire-helpers";
import type { AnnuaireCategory, AnnuaireItem } from "@/types/annuaire";

const TABS: { key: AnnuaireCategory; icon: string; label: string }[] = [
  { key: "universities", icon: "fas fa-graduation-cap", label: "Universités & Écoles" },
  { key: "companies", icon: "fas fa-building", label: "Entreprises & Recruteurs" },
  { key: "clubs", icon: "fas fa-comments", label: "Clubs d'Anglais" },
];

function splitCities(value?: string): string[] {
  return (value || "")
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);
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

  return (
    <div className="sala-layout-wrapper">
      <AppSidebar />
      <div className="sala-main-content">
        <AppTopbar />

        <div className="container py-4">
          <div className="text-center mb-3">
            <span className="badge-sala-green px-3 py-1 mb-2">Réseau &amp; Écosystème Congolais</span>
            <h1 className="h2 fw-bold mb-2">Les Annuaires Sala</h1>
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

      <Modal open={!!detailItem} onClose={() => setDetailItem(null)} title={annuaireModalTitle(category)} size="md">
        {detailItem && <AnnuaireDetailContent category={category} item={detailItem} />}
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
