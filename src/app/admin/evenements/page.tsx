// src/app/admin/evenements/page.tsx
// Grille de cartes pour gérer les événements (collection "evenements").

"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useEvents } from "@/hooks/useEvents";
import { CompanyTile } from "@/components/CompanyTile";
import { EventFormModal } from "@/components/admin/EventFormModal";
import { RegistrationsModal } from "@/components/admin/RegistrationsModal";
import { confirmDelete, notify } from "@/lib/notify";
import type { SalaEvent } from "@/types/event";

export default function AdminEventsPage() {
  const { events, loading } = useEvents();
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<SalaEvent | null>(null);
  const [registrationsTarget, setRegistrationsTarget] = useState<SalaEvent | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setEditingEvent(null);
      setModalOpen(true);
      router.replace("/admin/evenements");
    }
  }, [searchParams, router]);

  const term = search.trim().toLowerCase();
  const filtered = events.filter(
    (evt) => !term || [evt.title, evt.organizer, evt.city].some((v) => (v || "").toLowerCase().includes(term))
  );

  async function handleDelete(evt: SalaEvent) {
    if (await confirmDelete(evt.title || "cet événement")) {
      try {
        await deleteDoc(doc(db, "evenements", evt.id));
        notify("Événement supprimé.");
      } catch (err) {
        console.error("Erreur suppression événement :", err);
        notify("Erreur lors de la suppression.", "error");
      }
    }
  }

  return (
    <section>
      <div className="admin-section-header">
        <div>
          <h1 className="admin-page-title">Événements</h1>
          <p className="admin-page-subtitle">Salons, ateliers et webinaires affichés sur la page Événements.</p>
        </div>
        <button
          className="btn-sala-primary"
          onClick={() => {
            setEditingEvent(null);
            setModalOpen(true);
          }}
        >
          <i className="fas fa-plus me-1"></i> Ajouter un événement
        </button>
      </div>

      <div className="admin-toolbar">
        <div className="admin-search-wrap">
          <i className="fas fa-search"></i>
          <input
            type="text"
            className="admin-search-input"
            placeholder="Rechercher par titre, organisateur, ville..."
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
            {events.length === 0 ? "Aucun événement publié pour le moment." : "Aucun événement ne correspond à votre recherche."}
          </div>
        )}

        {!loading &&
          filtered.map((evt) => (
            <div className="admin-card" key={evt.id}>
              <div className="admin-card-top">
                <div className="admin-row-identity">
                  <CompanyTile company={evt.organizer || evt.title} />
                  <div>
                    <div className="title">{evt.title || "Événement sans titre"}</div>
                    <div className="subtitle">{evt.organizer || "Organisateur non précisé"}</div>
                  </div>
                </div>
              </div>
              <div className="admin-card-meta">
                <span className="admin-badge">{evt.category || "—"}</span>
                <span><i className="far fa-calendar"></i>{evt.date || "—"}</span>
                <span><i className="fas fa-map-marker-alt"></i>{evt.city || "—"}</span>
              </div>
              <div className="admin-card-footer">
                <span className="text-muted small">{evt.location || ""}</span>
                <div className="admin-actions">
                  <button className="btn-icon" title="Voir les inscriptions" onClick={() => setRegistrationsTarget(evt)}>
                    <i className="fas fa-users"></i>
                  </button>
                  <button
                    className="btn-icon btn-icon-edit"
                    title="Modifier"
                    onClick={() => {
                      setEditingEvent(evt);
                      setModalOpen(true);
                    }}
                  >
                    <i className="fas fa-pen"></i>
                  </button>
                  <button className="btn-icon btn-icon-delete" title="Supprimer" onClick={() => handleDelete(evt)}>
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          ))}
      </div>

      <EventFormModal open={modalOpen} event={editingEvent} onClose={() => setModalOpen(false)} />
      <RegistrationsModal
        open={!!registrationsTarget}
        eventId={registrationsTarget?.id || null}
        eventTitle={registrationsTarget?.title || ""}
        onClose={() => setRegistrationsTarget(null)}
      />
    </section>
  );
}
