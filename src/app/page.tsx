// src/app/page.tsx
// Page d'accueil : héro, bande de valeurs, dernières offres en direct
// (Firestore), footer, navigation mobile et FAB "Faire un CV".

"use client";

import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { BottomNav } from "@/components/layout/BottomNav";
import { FabCv } from "@/components/layout/FabCv";
import { JobCard } from "@/components/JobCard";
import { useActiveJobs } from "@/hooks/useJobs";
import { useCompanyLogos } from "@/hooks/useCompanyLogos";

export default function HomePage() {
  const { jobs, loading, error } = useActiveJobs();
  const latestJobs = jobs.slice(0, 5);
  const logos = useCompanyLogos(latestJobs.map((j) => j.company));

  return (
    <>
      <Navbar />

      <section className="hero">
        <div className="container">
          <div className="row align-items-center g-5">
            <div className="col-lg-6">
              <span className="section-eyebrow section-eyebrow-normal-case">ONG SALA - Partout en République du Congo</span>
              <h1
                className="hero-title fw-bold mb-3"
                style={{ fontFamily: "var(--sala-font-display)", color: "var(--sala-text-primary)" }}
              >
                SALA, Mosala na Tshombo
              </h1>
              <p className="text-secondary mb-4" style={{ fontSize: "1.05rem", maxWidth: 480 }}>
                Sala rassemble les offres d&apos;emploi et de stage, un générateur de CV professionnel et
                les ressources dont vous avez besoin pour décrocher un poste — entièrement gratuit.
              </p>
              <div className="d-flex flex-wrap gap-3">
                <Link href="/onboarding" className="btn-sala-discover py-3 px-4 fw-bold">
                  <i className="fas fa-compass me-2"></i>Découvrir Sala
                </Link>
                <Link href="/offres" className="btn-sala-primary py-3 px-4 fw-bold">
                  Explorer les offres <i className="fas fa-arrow-right ms-2"></i>
                </Link>
                <Link href="/cv-builder" className="btn-sala-outline py-3 px-4 fw-bold">
                  <i className="fas fa-file-invoice me-2"></i>Créer mon CV
                </Link>
              </div>
              <div className="hero-trust-row">
                <div className="hero-trust-item">
                  <i className="fas fa-map-marker-alt"></i> Brazzaville &amp; Pointe-Noire
                </div>
                <div className="hero-trust-item">
                  <i className="fas fa-hand-holding-heart"></i> 100% gratuit
                </div>
                <div className="hero-trust-item">
                  <i className="fas fa-bolt"></i> Offres mises à jour chaque jour
                </div>
              </div>
            </div>
            <div className="col-lg-6 d-none d-lg-block">
              <div className="hero-preview-card">
                <div className="sala-job-card">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <div className="sala-job-card-title">Technicien de Maintenance</div>
                      <div className="sala-job-card-company">
                        <i className="fas fa-building text-success me-1"></i>TotalEnergies EP Congo
                      </div>
                    </div>
                  </div>
                  <div className="sala-job-card-meta">
                    <span>
                      <i className="fas fa-map-marker-alt"></i> Pointe-Noire
                    </span>
                    <span className="badge-sala-contract">CDI</span>
                  </div>
                </div>
                <div className="sala-job-card">
                  <div className="sala-job-card-title">Assistant(e) de Direction</div>
                  <div className="sala-job-card-company">
                    <i className="fas fa-building text-success me-1"></i>MTN Congo
                  </div>
                  <div className="sala-job-card-meta">
                    <span>
                      <i className="fas fa-map-marker-alt"></i> Brazzaville
                    </span>
                    <span className="badge-sala-contract">CDD</span>
                  </div>
                </div>
                <div className="sala-job-card">
                  <div className="sala-job-card-title">Chargé d&apos;Approvisionnement</div>
                  <div className="sala-job-card-company">
                    <i className="fas fa-building text-success me-1"></i>AGL Congo
                  </div>
                  <div className="sala-job-card-meta">
                    <span>
                      <i className="fas fa-map-marker-alt"></i> Brazzaville
                    </span>
                    <span className="badge-sala-contract">Stage</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="value-strip bg-white">
        <div className="container">
          <div className="row g-4">
            <div className="col-md-3 col-sm-6">
              <div className="value-item">
                <div className="icon-box">
                  <i className="fas fa-calendar-check"></i>
                </div>
                <div>
                  <div className="fw-bold" style={{ fontSize: "0.92rem" }}>Offres quotidiennes</div>
                  <div className="text-muted small">De nouvelles opportunités chaque jour.</div>
                </div>
              </div>
            </div>
            <div className="col-md-3 col-sm-6">
              <div className="value-item">
                <div className="icon-box">
                  <i className="fas fa-paper-plane"></i>
                </div>
                <div>
                  <div className="fw-bold" style={{ fontSize: "0.92rem" }}>Candidature en 1 clic</div>
                  <div className="text-muted small">Postulez avec votre CV enregistré.</div>
                </div>
              </div>
            </div>
            <div className="col-md-3 col-sm-6">
              <div className="value-item">
                <div className="icon-box">
                  <i className="fas fa-file-invoice"></i>
                </div>
                <div>
                  <div className="fw-bold" style={{ fontSize: "0.92rem" }}>CV professionnel</div>
                  <div className="text-muted small">Créez et téléchargez votre CV en PDF.</div>
                </div>
              </div>
            </div>
            <div className="col-md-3 col-sm-6">
              <div className="value-item">
                <div className="icon-box">
                  <i className="fas fa-hand-holding-heart"></i>
                </div>
                <div>
                  <div className="fw-bold" style={{ fontSize: "0.92rem" }}>100% gratuit</div>
                  <div className="text-muted small">Sala est et restera gratuit pour tous.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-5" id="emplois" style={{ background: "#f8f9fa" }}>
        <div className="container">
          <div className="text-center mb-5">
            <span className="section-eyebrow">Opportunités récentes</span>
            <h2 className="fw-bold mb-2" style={{ fontFamily: "var(--sala-font-display)" }}>
              Dernières offres d&apos;emploi &amp; stages
            </h2>
            <p className="text-muted mb-0">
              Trouvez votre futur poste à Brazzaville, Pointe-Noire et dans toute la République du Congo
            </p>
          </div>

          <div style={{ maxWidth: 780, margin: "0 auto" }}>
            {loading && (
              <div className="sala-job-card text-center py-4">
                <div className="spinner-border text-success" role="status">
                  <span className="visually-hidden">Chargement...</span>
                </div>
                <p className="text-muted mt-2 mb-0">Chargement des opportunités disponibles...</p>
              </div>
            )}

            {!loading && error && <p className="text-danger small text-center">{error}</p>}

            {!loading && !error && latestJobs.length === 0 && (
              <div className="text-center py-4 bg-white rounded-3 p-4 shadow-sm">
                <i className="fas fa-briefcase fa-2x text-muted mb-2"></i>
                <h6 className="text-dark fw-bold">Aucune offre disponible actuellement</h6>
                <p className="text-muted small mb-0">
                  Revenez très bientôt pour découvrir de nouvelles opportunités au Congo.
                </p>
              </div>
            )}

            {!loading &&
              !error &&
              latestJobs.map((job) => (
                <JobCard key={job.id} job={job} logoUrl={job.company ? logos[job.company] : null} />
              ))}
          </div>

          <div className="text-center mt-5">
            <Link className="btn-sala-primary py-3 px-5 fw-bold" href="/offres">
              Explorer toutes les offres <i className="fas fa-arrow-right ms-2"></i>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
      <FabCv />
      <BottomNav />
    </>
  );
}
