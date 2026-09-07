// src/components/admin/RegistrationsModal.tsx
// Liste des inscrits à un événement (collection "inscriptions_evenements").

"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Modal } from "@/components/Modal";
import type { Registration } from "@/types/event";

interface RegistrationsModalProps {
  open: boolean;
  eventId: string | null;
  eventTitle: string;
  onClose: () => void;
}

export function RegistrationsModal({ open, eventId, eventTitle, onClose }: RegistrationsModalProps) {
  const [registrations, setRegistrations] = useState<Registration[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!open || !eventId) return;
    setRegistrations(null);
    setError(false);
    getDocs(query(collection(db, "inscriptions_evenements"), where("eventId", "==", eventId)))
      .then((snap) => setRegistrations(snap.docs.map((d) => d.data() as Registration)))
      .catch((err) => {
        console.error("Erreur chargement inscriptions :", err);
        setError(true);
      });
  }, [open, eventId]);

  return (
    <Modal open={open} onClose={onClose} title={`Inscrits — ${eventTitle}`}>
      {error && <p className="text-danger small">Impossible de charger les inscriptions.</p>}
      {!error && registrations === null && (
        <div className="text-center py-3">
          <div className="spinner-border text-success"></div>
        </div>
      )}
      {!error && registrations && registrations.length === 0 && (
        <p className="admin-empty">Aucune inscription pour cet événement pour le moment.</p>
      )}
      {!error && registrations && registrations.length > 0 && (
        <>
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Email</th>
                  <th>Téléphone</th>
                </tr>
              </thead>
              <tbody>
                {registrations.map((r, i) => (
                  <tr key={i}>
                    <td>{r.name || ""}</td>
                    <td>{r.email || ""}</td>
                    <td>{r.phone || ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-muted small mb-0">{registrations.length} inscription(s) au total.</p>
        </>
      )}
    </Modal>
  );
}
