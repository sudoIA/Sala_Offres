// src/app/admin/evenements/page.tsx
// Grille de cartes pour gérer les événements (collection "events").

"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { collection, deleteDoc, doc, getCountFromServer, getDocs, limit, query, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useEvents } from "@/hooks/useEvents";
import { usePagination } from "@/hooks/usePagination";
import { CompanyTile } from "@/components/CompanyTile";
import { EventFormModal } from "@/components/admin/EventFormModal";
import { Pagination } from "@/components/admin/Pagination";
import { confirmDelete, notify } from "@/lib/notify";
import type { SalaEvent } from "@/types/event";
import { safeExternalUrl } from "@/lib/safe-url";
import { logAdminAction } from "@/lib/admin-log";

export default function AdminEventsPage() {
  const { events, loading } = useEvents();
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<SalaEvent | null>(null);
  // Anciennes inscriptions faites sur le site (formulaire retiré : Sala est
  // un site vitrine, l'inscription se fait chez l'organisateur).
  const [oldRegistrations, setOldRegistrations] = useState(0);
  const [purging, setPurging] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setEditingEvent(null);
      setModalOpen(true);
      router.replace("/admin/evenements");
    }
  }, [searchParams, router]);

  useEffect(() => {
    getCountFromServer(collection(db, "inscriptions_evenements"))
      .then((snap) => setOldRegistrations(snap.data().count))
      .catch(() => setOldRegistrations(0));
  }, []);

  async function purgeRegistrations() {
    if (!(await confirmDelete(`les ${oldRegistrations} anciennes inscriptions (noms, e-mails, téléphones)`))) return;
    setPurging(true);
    try {
      let deleted = 0;
      // Par lots de 400 (une écriture groupée Firestore est limitée à 500).
      for (;;) {
        const snap = await getDocs(query(collection(db, "inscriptions_evenements"), limit(400)));
        if (snap.empty) break;
        const batch = writeBatch(db);
        snap.docs.forEach((d) => batch.delete(d.ref));
        await batch.commit();
        deleted += snap.size;
      }
      await logAdminAction("delete", "inscriptions_evenements", `${deleted} ancienne(s) inscription(s) supprimée(s)`);
      setOldRegistrations(0);
      notify(`${deleted} inscription(s) supprimée(s).`);
    } catch (err) {
      console.error("Erreur suppression des inscriptions :", err);
      notify("Erreur : " + (err as Error).message, "error");
    } finally {
      setPurging(false);
    }
  }

  const term = search.trim().toLowerCase();
  const filtered = events.filter(
    (evt) => !term || [evt.title, evt.host, evt.city].some((v) => (v || "").toLowerCase().includes(term))
  );
  const { pageItems, page, totalPages, setPage } = usePagination(filtered, term);

  async function handleDelete(evt: SalaEvent) {
    if (await confirmDelete(evt.title || "cet événement")) {
      try {
        await deleteDoc(doc(db, "events", evt.id));
        await logAdminAction("delete", "events", evt.title || "Événement", evt.id);
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

      {oldRegistrations > 0 && (
        <div className="alert alert-warning d-flex flex-wrap align-items-center justify-content-between gap-2">
          <span className="small">
            <i className="fas fa-user-shield me-1"></i>
            {oldRegistrations} ancienne(s) inscription(s) faite(s) sur le site sont encore stockées (noms, e-mails,
            téléphones). L&apos;inscription se fait désormais chez l&apos;organisateur : ces données ne servent plus.
          </span>
          <button className="btn btn-danger btn-sm" onClick={purgeRegistrations} disabled={purging}>
            {purging ? "Suppression..." : "Supprimer ces données"}
          </button>
        </div>
      )}

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
          pageItems.map((evt) => (
            <div className="admin-card" key={evt.id}>
              <div className="admin-card-top">
                <div className="admin-row-identity">
                  <CompanyTile company={evt.host || evt.title} />
                  <div>
                    <div className="title">{evt.title || "Événement sans titre"}</div>
                    <div className="subtitle">{evt.host || "Organisateur non précisé"}</div>
                  </div>
                </div>
              </div>
              <div className="admin-card-meta">
                <span className="admin-badge">{evt.visibility === false ? "Masqué" : "Visible"}</span>
                <span><i className="far fa-calendar"></i>{evt.deadlineDate ? evt.deadlineDate.toLocaleString("fr-FR") : "-"}</span>
                <span><i className="fas fa-map-marker-alt"></i>{evt.city || "-"}</span>
              </div>
              <div className="admin-card-footer">
                <span className="text-muted small">
                  {evt.site ? (
                    <a href={safeExternalUrl(evt.site) ?? undefined} target="_blank" rel="noopener">
                      <i className="fas fa-link me-1"></i>Lien d&apos;inscription
                    </a>
                  ) : (
                    ""
                  )}
                </span>
                <div className="admin-actions">
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

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />

      <EventFormModal open={modalOpen} event={editingEvent} onClose={() => setModalOpen(false)} />
    </section>
  );
}
