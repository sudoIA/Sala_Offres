// src/app/entreprises/[id]/CompanyPageClient.tsx
// Fiche d'annuaire d'une entreprise + ses offres d'emploi en cours, reliées
// par le nom (voir src/lib/company-match.ts).

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppTopbar } from "@/components/layout/AppTopbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { FabCv } from "@/components/layout/FabCv";
import { AnnuaireDetailContent } from "@/components/annuaire/AnnuaireDetailContent";
import { JobCard } from "@/components/JobCard";
import { useActiveJobs } from "@/hooks/useJobs";
import { useCompanyLogos } from "@/hooks/useCompanyLogos";
import { matchesCompanyItem } from "@/lib/company-match";
import { annuaireFullName } from "@/lib/annuaire-helpers";
import { ANNUAIRE_COLLECTIONS, type AnnuaireItem, type AnnuaireItemDoc } from "@/types/annuaire";

export function CompanyPageClient({ id }: { id: string }) {
  const [company, setCompany] = useState<AnnuaireItem | null>(null);
  const [loading, setLoading] = useState(true);
  const { jobs, loading: jobsLoading } = useActiveJobs();

  useEffect(() => {
    let cancelled = false;
    getDoc(doc(db, ANNUAIRE_COLLECTIONS.companies, id))
      .then((snap) => {
        if (!cancelled) setCompany(snap.exists() ? { id: snap.id, ...(snap.data() as AnnuaireItemDoc) } : null);
      })
      .catch((err) => console.error("Erreur chargement de l'entreprise :", err))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const companyJobs = useMemo(
    () => (company ? jobs.filter((j) => matchesCompanyItem(j.company, company)) : []),
    [jobs, company]
  );
  const logos = useCompanyLogos(companyJobs.map((j) => j.company));

  return (
    <div className="sala-layout-wrapper">
      <AppSidebar />
      <div className="sala-main-content">
        <AppTopbar />

        <div className="container py-4" style={{ maxWidth: 1040 }}>
          <Link href="/annuaires?cat=companies" className="small d-inline-block mb-3">
            <i className="fas fa-arrow-left me-1"></i> Annuaire des entreprises
          </Link>

          {loading && (
            <div className="text-center py-5">
              <div className="spinner-border text-success"></div>
            </div>
          )}

          {!loading && !company && (
            <div className="profile-card p-5 text-center">
              <i className="fas fa-building fa-2x text-muted mb-3"></i>
              <h1 className="h5 fw-bold">Entreprise introuvable</h1>
              <p className="text-muted">Cette fiche n&apos;existe plus ou a été retirée de l&apos;annuaire.</p>
              <Link href="/annuaires?cat=companies" className="btn-sala-primary rounded-pill px-4 py-2">Voir l&apos;annuaire</Link>
            </div>
          )}

          {!loading && company && (
            <div className="row g-4">
              <div className="col-lg-5">
                <div className="profile-card p-4">
                  <AnnuaireDetailContent category="companies" item={company} />
                </div>
              </div>

              <div className="col-lg-7">
                <h1 className="h5 fw-bold mb-3">
                  Offres en cours chez {annuaireFullName(company)}
                  {!jobsLoading && <span className="badge-sala-green ms-2">{companyJobs.length}</span>}
                </h1>

                {jobsLoading && <div className="spinner-border spinner-border-sm text-success"></div>}

                {!jobsLoading && companyJobs.length === 0 && (
                  <div className="profile-card p-4 text-center">
                    <i className="fas fa-briefcase fa-2x text-muted mb-2"></i>
                    <p className="text-muted mb-3">Aucune offre de cette entreprise n&apos;est ouverte en ce moment.</p>
                    <Link href="/offres" className="btn-sala-outline rounded-pill px-4 py-2">Voir toutes les offres</Link>
                  </div>
                )}

                <div className="d-flex flex-column gap-2">
                  {companyJobs.map((job) => (
                    <JobCard key={job.id} job={job} logoUrl={job.company ? logos[job.company] : null} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <FabCv />
      <BottomNav />
    </div>
  );
}
