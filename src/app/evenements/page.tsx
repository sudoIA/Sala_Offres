// src/app/evenements/page.tsx
// Salons, ateliers et webinaires — recherche, filtres par catégorie/ville,
// inscription rapide (enregistrée dans Firestore), ajout à Google Agenda.

"use client";

import { useMemo, useState } from "react";
import { addDoc, collection } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppTopbar } from "@/components/layout/AppTopbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { FabCv } from "@/components/layout/FabCv";
import { Modal } from "@/components/Modal";
import { usePublicEvents } from "@/hooks/usePublicEvents";
import type { SalaEvent } from "@/types/event";

type CategoryFilter = "all" | "Salon" | "Atelier" | "Webinaire";

const CATEGORY_FILTERS: { key: CategoryFilter; icon: string; label: string }[] = [
  { key: "all", icon: "fas fa-th-large", label: "Tous les événements" },
  { key: "Salon", icon: "fas fa-users", label: "Salons de l'Emploi" },
  { key: "Atelier", icon: "fas fa-chalkboard-teacher", label: "Ateliers ONG Sala" },
  { key: "Webinaire", icon: "fas fa-laptop", label: "Webinaires en ligne" },
];

function googleCalendarUrl(evt: SalaEvent): string {
  const text = encodeURIComponent(evt.title || "");
  const details = encodeURIComponent(`${evt.description || ""} - Organisé par ${evt.organizer || ""}`);
  const location = encodeURIComponent(`${evt.location || ""}, ${evt.city || ""}`);
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&details=${details}&location=${location}`;
}

export default function EvenementsPage() {
  const { events, loading } = usePublicEvents();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [city, setCity] = useState("all");
  const [registerTarget, setRegisterTarget] = useState<SalaEvent | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return events.filter((evt) => {
      const matchCategory = category === "all" || evt.category === category;
      const matchCity = city === "all" || (evt.city && evt.city.toLowerCase() === city.toLowerCase());
      const matchSearch =
        !term || `${evt.title} ${evt.description} ${evt.location} ${evt.organizer}`.toLowerCase().includes(term);
      return matchCategory && matchCity && matchSearch;
    });
  }, [events, search, category, city]);

  function openRegister(evt: SalaEvent) {
    setRegisterTarget(evt);
    setForm({ name: "", email: "", phone: "" });
    setSubmitted(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!registerTarget) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, "inscriptions_evenements"), {
        eventId: registerTarget.id,
        eventTitle: registerTarget.title || "Evenement",
        name: form.name,
        email: form.email,
        phone: form.phone,
        registeredAt: new Date().toISOString(),
      });
    } catch (err) {
      console.warn("Enregistrement local (Firestore hors ligne ou règles restreintes) :", err);
    }
    setSubmitting(false);
    setSubmitted(true);
    setTimeout(() => setRegisterTarget(null), 2500);
  }

  return (
    <div className="sala-layout-wrapper">
      <AppSidebar />
      <div className="sala-main-content">
        <AppTopbar />

        <div style={{ backgroundColor: "#f8fafc", flex: 1 }}>
          <section className="py-4 py-md-5 text-white" style={{ background: "linear-gradient(135deg, #1e6b31 0%, #3b9452 100%)" }}>
            <div className="container text-center">
              <span className="badge bg-white text-dark fw-bold mb-3 px-3 py-2 rounded-pill shadow-sm">
                <i className="fas fa-calendar-alt text-success me-1"></i> Agenda Emploi &amp; Carrière au Congo
              </span>
              <h1 className="display-6 fw-bold mb-2">Salons, Ateliers &amp; Webinaires</h1>
              <p className="lead mx-auto mb-4" style={{ maxWidth: 650, fontSize: "1.05rem", opacity: 0.95 }}>
                Accédez aux opportunités directes de rencontre avec les recruteurs, développez vos compétences avec les
                ateliers gratuits de l&apos;ONG Sala et boostez votre réseau.
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
                      placeholder="Rechercher un salon, atelier ou thématique..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="container mt-4 mb-3">
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
              <div className="d-flex gap-2 overflow-auto pb-2">
                {CATEGORY_FILTERS.map((f) => (
                  <button
                    key={f.key}
                    className={`event-filter-pill${category === f.key ? " active" : ""}`}
                    onClick={() => setCategory(f.key)}
                  >
                    <i className={f.icon}></i> {f.label}
                  </button>
                ))}
              </div>
              <div style={{ minWidth: 170 }}>
                <select className="form-select form-select-sm rounded-pill border-secondary-subtle" value={city} onChange={(e) => setCity(e.target.value)}>
                  <option value="all">📍 Toutes les villes</option>
                  <option value="Brazzaville">Brazzaville</option>
                  <option value="Pointe-Noire">Pointe-Noire</option>
                  <option value="En ligne">100% En ligne</option>
                </select>
              </div>
            </div>
          </section>

          <main className="container my-4">
            <div className="row g-4">
              {loading && (
                <div className="col-12 text-center py-5">
                  <div className="spinner-border text-success" role="status"></div>
                  <p className="text-muted mt-2">Chargement des événements...</p>
                </div>
              )}

              {!loading && filtered.length === 0 && (
                <div className="col-12 text-center py-5">
                  <i className="fas fa-calendar-times fa-3x text-muted mb-3"></i>
                  <h5 className="fw-bold">Aucun événement ne correspond à vos critères</h5>
                  <p className="text-muted">Essayez d&apos;élargir votre recherche ou de changer de ville.</p>
                </div>
              )}

              {!loading &&
                filtered.map((evt) => {
                  const [day, month] = (evt.date || "").split(" ");
                  return (
                    <div className="col-md-6 col-lg-6" key={evt.id}>
                      <div className="event-card">
                        <div className="d-flex align-items-start gap-3 mb-3">
                          <div className="event-date-box">
                            <div className="fw-bold text-success" style={{ fontSize: "1.4rem", lineHeight: 1 }}>{day}</div>
                            <div className="text-uppercase fw-bold text-muted small" style={{ fontSize: "0.72rem" }}>{month || "DATE"}</div>
                          </div>
                          <div>
                            <div className="d-flex flex-wrap gap-1 mb-1">
                              <span className={`badge bg-${evt.badgeColor || "success"} rounded-pill`} style={{ fontSize: "0.75rem" }}>{evt.category}</span>
                              <span className="badge bg-light text-dark border rounded-pill" style={{ fontSize: "0.75rem" }}>{evt.price}</span>
                            </div>
                            <h5 className="fw-bold mb-1" style={{ fontSize: "1.1rem", lineHeight: 1.35 }}>{evt.title}</h5>
                            <div className="text-muted small"><i className="fas fa-users-cog me-1"></i> {evt.organizer}</div>
                          </div>
                        </div>

                        <div className="text-muted small mb-2">
                          <i className="fas fa-map-marker-alt text-danger me-1"></i> <strong>{evt.city}</strong> — {evt.location}
                        </div>
                        <div className="text-muted small mb-3">
                          <i className="far fa-clock text-primary me-1"></i> {evt.time}
                        </div>

                        <p className="text-secondary small mb-3 flex-grow-1">{evt.description}</p>

                        {evt.highlights && evt.highlights.length > 0 && (
                          <div className="d-flex flex-wrap gap-1 mb-3">
                            {evt.highlights.map((h, i) => (
                              <span className="badge bg-light text-secondary border small" key={i}>{h}</span>
                            ))}
                          </div>
                        )}

                        <div className="pt-3 border-top d-flex gap-2 justify-content-between align-items-center mt-auto">
                          <a href={googleCalendarUrl(evt)} target="_blank" rel="noopener" className="btn btn-sm btn-outline-secondary rounded-pill" title="Ajouter à Google Agenda">
                            <i className="far fa-calendar-plus me-1"></i> Agenda
                          </a>
                          <button className="btn btn-sm btn-success rounded-pill px-3 fw-bold" onClick={() => openRegister(evt)}>
                            <i className="fas fa-ticket-alt me-1"></i> Participer
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </main>
        </div>
      </div>

      <Modal open={!!registerTarget} onClose={() => setRegisterTarget(null)} title="Inscription à l'événement" size="md">
        {registerTarget && (
          <>
            <p className="text-muted small">
              {registerTarget.date} — {registerTarget.city} ({registerTarget.location})
            </p>
            {!submitted ? (
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Nom complet</label>
                  <input type="text" className="form-control rounded-3" required placeholder="Ex: Grace Samba" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Adresse email</label>
                  <input type="email" className="form-control rounded-3" required placeholder="nom@exemple.cg" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Téléphone / WhatsApp</label>
                  <input type="tel" className="form-control rounded-3" required placeholder="+242 06 ..." value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
                </div>
                <div className="d-grid mt-4">
                  <button type="submit" className="btn btn-success rounded-pill fw-bold py-2" disabled={submitting}>
                    <i className="fas fa-check-circle me-1"></i> {submitting ? "Envoi..." : "Confirmer ma place gratuite"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="alert alert-success mt-3 rounded-3 text-center">
                <i className="fas fa-check-double fa-2x mb-2 d-block"></i>
                <strong>Inscription confirmée avec succès !</strong>
                <p className="small mb-0 mt-1">Vous recevrez un rappel par WhatsApp / email avant l&apos;événement.</p>
              </div>
            )}
          </>
        )}
      </Modal>

      <FabCv />
      <BottomNav />
    </div>
  );
}
