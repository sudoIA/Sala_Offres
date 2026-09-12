// src/app/legislation/page.tsx
// Guide Droit du Travail congolais : fiches thématiques (Firestore + repli
// intégré) + fiche fixe "Organismes publics", recherche et filtre par thème.

"use client";

import { useMemo, useState } from "react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppTopbar } from "@/components/layout/AppTopbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { FabCv } from "@/components/layout/FabCv";
import { LegislationCard } from "@/components/LegislationCard";
import { usePublicLegislation } from "@/hooks/usePublicLegislation";
import { useSiteSettings } from "@/hooks/useSiteSettings";

type TopicFilter =
  | "all"
  | "contrat"
  | "salaire"
  | "horaires"
  | "conges"
  | "rupture"
  | "hygiene"
  | "representation"
  | "conflits"
  | "organismes";

const TOPIC_FILTERS: { key: TopicFilter; icon: string; label: string }[] = [
  { key: "all", icon: "fas fa-list-ul", label: "Tous les thèmes" },
  { key: "contrat", icon: "fas fa-file-contract", label: "Contrat & Essai" },
  { key: "salaire", icon: "fas fa-money-bill-wave", label: "Salaire & SMIG" },
  { key: "horaires", icon: "fas fa-clock", label: "Horaires & Heures sup" },
  { key: "conges", icon: "fas fa-umbrella-beach", label: "Congés & Maternité" },
  { key: "rupture", icon: "fas fa-door-open", label: "Rupture & Préavis" },
  { key: "hygiene", icon: "fas fa-hard-hat", label: "Hygiène & Sécurité" },
  { key: "representation", icon: "fas fa-users", label: "Délégués & Syndicats" },
  { key: "conflits", icon: "fas fa-gavel", label: "Conflits & Tribunal" },
  { key: "organismes", icon: "fas fa-landmark", label: "ACPE, CNSS & DGT" },
];

export default function LegislationPage() {
  const { topics, loading } = usePublicLegislation();
  const settings = useSiteSettings();
  const [search, setSearch] = useState("");
  const [topic, setTopic] = useState<TopicFilter>("all");

  const term = search.trim().toLowerCase();

  const filteredTopics = useMemo(() => {
    if (topic === "organismes") return [];
    return topics.filter((fiche) => {
      const matchTopic = topic === "all" || fiche.topic === topic;
      if (!matchTopic) return false;
      if (!term) return true;
      const text = `${fiche.title} ${fiche.topicLabel} ${fiche.intro} ${fiche.bodyHtml}`.toLowerCase();
      return text.includes(term);
    });
  }, [topics, topic, term]);

  const showOrganismes =
    (topic === "all" || topic === "organismes") &&
    (!term ||
      "acpe onemo cnss dgt inspection travail litige congo brazzaville pointe-noire securite sociale".includes(term));

  return (
    <div className="sala-layout-wrapper">
      <AppSidebar />
      <div className="sala-main-content">
        <AppTopbar />

        <div style={{ backgroundColor: "var(--sala-bg)", flex: 1 }}>
          <section className="py-4 py-md-5 text-white" style={{ background: "linear-gradient(135deg, #1e6b31 0%, #3b9452 100%)" }}>
            <div className="container text-center">
              <span className="badge bg-white text-dark fw-bold mb-3 px-3 py-2 rounded-pill shadow-sm">
                <i className="fas fa-balance-scale text-success me-1"></i> Loi n° 45-75 &amp; Code du Travail du Congo
              </span>
              <h1 className="display-6 fw-bold mb-2">Vos Droits &amp; Devoirs de Travailleur</h1>
              <p className="lead mx-auto mb-4" style={{ maxWidth: 650, fontSize: "1.05rem", opacity: 0.95 }}>
                Comprenez vos droits fondamentaux au travail en République du Congo : contrats, salaires, heures de
                travail, congés et démarches en cas de litige.
              </p>
              <div className="row justify-content-center">
                <div className="col-md-7 col-lg-6">
                  <div className="input-group shadow-lg rounded-pill overflow-hidden bg-white p-1">
                    <span className="input-group-text bg-white border-0 ps-3">
                      <i className="fas fa-search text-muted"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control border-0 shadow-none ps-2"
                      placeholder="Ex: période d'essai, SMIG, congés, préavis..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="container mt-4 mb-3">
            <div className="d-flex gap-2 overflow-auto pb-2">
              {TOPIC_FILTERS.map((f) => (
                <button key={f.key} className={`topic-pill${topic === f.key ? " active" : ""}`} onClick={() => setTopic(f.key)}>
                  <i className={f.icon}></i> {f.label}
                </button>
              ))}
            </div>
          </section>

          <main className="container my-4">
            <div className="row">
              {loading && (
                <div className="col-12 text-center py-5">
                  <div className="spinner-border text-success"></div>
                  <p className="text-muted mt-2">Chargement du guide...</p>
                </div>
              )}

              {!loading &&
                filteredTopics.map((fiche) => (
                  <div className="col-lg-6" key={fiche.id}>
                    <LegislationCard fiche={fiche} />
                  </div>
                ))}

              {!loading && showOrganismes && (
                <div className="col-lg-6">
                  <div className="law-card">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <span className="badge-article"><i className="fas fa-building me-1"></i> Institutions Publiques</span>
                      <span className="badge bg-light text-secondary border">Protection &amp; Recours</span>
                    </div>
                    <h4 className="fw-bold mb-2">ACPE, CNSS &amp; Inspection du Travail</h4>
                    <p className="text-secondary small">Institutions congolaises clés qui accompagnent et protègent les jeunes travailleurs.</p>

                    <div className="p-3 bg-light rounded-3 mb-2 border">
                      <div className="d-flex align-items-center gap-2 mb-1">
                        <span className="badge bg-success">ACPE</span>
                        <strong className="small text-dark">Agence Congolaise Pour l&apos;Emploi (ex-ONEMO)</strong>
                      </div>
                      <p className="small text-muted mb-1">
                        Enregistre les demandeurs d&apos;emploi, vise les contrats d&apos;apprentissage et centralise les offres d&apos;entreprises.
                      </p>
                      <p className="small text-muted mb-0">
                        <i className="fas fa-map-marker-alt me-1"></i> Avenue Edith Lucie Bongo Ondimba, Zone Industrielle de Mpila, Brazzaville
                        <br />
                        <i className="fas fa-envelope me-1"></i> contact@acpe.cg
                        {" — "}
                        <a href="https://www.acpe.cg" target="_blank" rel="noopener">
                          www.acpe.cg
                        </a>
                      </p>
                    </div>

                    <div className="p-3 bg-light rounded-3 mb-2 border">
                      <div className="d-flex align-items-center gap-2 mb-1">
                        <span className="badge bg-primary">CNSS</span>
                        <strong className="small text-dark">Caisse Nationale de Sécurité Sociale</strong>
                      </div>
                      <p className="small text-muted mb-1">
                        Assure la couverture sociale : retraite, allocations familiales, couverture des accidents du travail et maladies professionnelles.
                      </p>
                      <p className="small text-muted mb-0">
                        <i className="fas fa-map-marker-alt me-1"></i> Bd Denis Sassou Nguesso, Rond-point de la Gare, Brazzaville
                        <br />
                        <i className="fas fa-phone me-1"></i> +242 06 719 62 62 — <i className="fas fa-envelope me-1"></i> infos@cnss.cg
                        {" — "}
                        <a href="https://www.cnss.cg" target="_blank" rel="noopener">
                          www.cnss.cg
                        </a>
                      </p>
                    </div>

                    <div className="p-3 bg-light rounded-3 border">
                      <div className="d-flex align-items-center gap-2 mb-1">
                        <span className="badge bg-danger">DGT / Inspection</span>
                        <strong className="small text-dark">Inspection du Travail (Ministère de la Fonction Publique, du Travail et de la Sécurité Sociale)</strong>
                      </div>
                      <p className="small text-muted mb-1">
                        En cas de conflit avec votre employeur, saisissez gratuitement l&apos;Inspection du Travail de votre
                        arrondissement (Brazzaville ou Pointe-Noire) pour une tentative de <strong>conciliation amiable obligatoire</strong>.
                      </p>
                      <p className="small text-muted mb-0">
                        <i className="fas fa-map-marker-alt me-1"></i> B.P. 131, Brazzaville
                        <br />
                        <i className="fas fa-phone me-1"></i> +242 05 51 35 62 — <i className="fas fa-envelope me-1"></i> contact@fonction-publique.gouv.cg
                        {" — "}
                        <a href="https://fonction-publique.gouv.cg" target="_blank" rel="noopener">
                          fonction-publique.gouv.cg
                        </a>
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {!loading && filteredTopics.length === 0 && !showOrganismes && (
                <div className="col-12 text-center py-5">
                  <i className="fas fa-search fa-3x text-muted mb-3"></i>
                  <h5 className="fw-bold">Aucune fiche ne correspond à votre recherche</h5>
                </div>
              )}
            </div>

            <div
              className="card border-0 text-white p-4 my-4 shadow-lg rounded-4"
              style={{ background: "linear-gradient(135deg, #1e6b31 0%, #15803d 100%)" }}
            >
              <div className="row align-items-center">
                <div className="col-md-8">
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <span className="badge bg-warning text-dark fw-bold">ONG Sala &amp; Jeunesse</span>
                    <span className="text-white-50 small">Assistance gratuite</span>
                  </div>
                  <h4 className="fw-bold mb-1">Une question sur vos droits ou un contrat litigieux ?</h4>
                  <p className="mb-0 opacity-90 small">
                    L&apos;équipe de l&apos;ONG Sala vous oriente vers les conseillers d&apos;insertion et l&apos;Inspection du Travail
                    compétente à Brazzaville et Pointe-Noire.
                  </p>
                </div>
                <div className="col-md-4 text-md-end mt-3 mt-md-0">
                  <a href={`mailto:${settings.contactEmail}`} className="btn btn-light rounded-pill px-4 py-2 fw-bold text-success shadow-sm">
                    <i className="fas fa-envelope me-1"></i> Écrire à l&apos;ONG Sala
                  </a>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      <FabCv />
      <BottomNav />
    </div>
  );
}
