// src/components/admin/EventFormModal.tsx
// Formulaire de création/édition d'un événement (collection "evenements").

"use client";

import { useEffect, useState, type FormEvent } from "react";
import { addDoc, collection, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Modal } from "@/components/Modal";
import { notify } from "@/lib/notify";
import type { SalaEvent } from "@/types/event";

interface EventFormModalProps {
  open: boolean;
  event: SalaEvent | null;
  onClose: () => void;
}

const EMPTY_FORM = {
  title: "",
  category: "Salon",
  organizer: "",
  date: "",
  isoDate: "",
  time: "",
  city: "",
  location: "",
  price: "",
  badgeColor: "success",
  description: "",
  highlights: "",
  registrationRequired: true,
};

export function EventFormModal({ open, event, onClose }: EventFormModalProps) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm({
      title: event?.title || "",
      category: event?.category || "Salon",
      organizer: event?.organizer || "",
      date: event?.date || "",
      isoDate: event?.isoDate ? event.isoDate.slice(0, 16) : "",
      time: event?.time || "",
      city: event?.city || "",
      location: event?.location || "",
      price: event?.price || "",
      badgeColor: event?.badgeColor || "success",
      description: event?.description || "",
      highlights: (event?.highlights || []).join(", "),
      registrationRequired: event ? !!event.registrationRequired : true,
    });
  }, [open, event]);

  function set<K extends keyof typeof EMPTY_FORM>(key: K, value: (typeof EMPTY_FORM)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    const eventData = {
      title: form.title.trim(),
      category: form.category,
      organizer: form.organizer.trim(),
      date: form.date.trim(),
      isoDate: form.isoDate ? `${form.isoDate}:00` : "",
      time: form.time.trim(),
      city: form.city.trim(),
      location: form.location.trim(),
      price: form.price.trim(),
      badgeColor: form.badgeColor,
      description: form.description.trim(),
      highlights: form.highlights.split(",").map((s) => s.trim()).filter(Boolean),
      registrationRequired: form.registrationRequired,
    };

    try {
      if (event) {
        await updateDoc(doc(db, "evenements", event.id), eventData);
        notify("Événement mis à jour.");
      } else {
        await addDoc(collection(db, "evenements"), eventData);
        notify("Événement ajouté avec succès !");
      }
      onClose();
    } catch (err) {
      console.error("Erreur publication événement :", err);
      notify("Erreur : " + (err as Error).message, "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={event ? "Modifier l'événement" : "Ajouter un événement"}>
      <form className="job-form" onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="eventTitle">Titre</label>
            <input id="eventTitle" type="text" value={form.title} onChange={(e) => set("title", e.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="eventCategory">Catégorie</label>
            <select id="eventCategory" value={form.category} onChange={(e) => set("category", e.target.value)}>
              <option value="Salon">Salon</option>
              <option value="Atelier">Atelier</option>
              <option value="Webinaire">Webinaire</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="eventOrganizer">Organisateur</label>
            <input id="eventOrganizer" type="text" value={form.organizer} onChange={(e) => set("organizer", e.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="eventDateDisplay">Date affichée</label>
            <input id="eventDateDisplay" type="text" placeholder="Ex: 25 Octobre 2026" value={form.date} onChange={(e) => set("date", e.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="eventIsoDate">Date &amp; heure de début</label>
            <input id="eventIsoDate" type="datetime-local" value={form.isoDate} onChange={(e) => set("isoDate", e.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="eventTime">Horaires affichés</label>
            <input id="eventTime" type="text" placeholder="Ex: 09h00 - 17h00" value={form.time} onChange={(e) => set("time", e.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="eventCity">Ville</label>
            <input id="eventCity" type="text" value={form.city} onChange={(e) => set("city", e.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="eventLocation">Lieu</label>
            <input id="eventLocation" type="text" value={form.location} onChange={(e) => set("location", e.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="eventPrice">Prix affiché</label>
            <input id="eventPrice" type="text" placeholder="Ex: Entrée Gratuite" value={form.price} onChange={(e) => set("price", e.target.value)} />
          </div>
          <div className="form-group">
            <label htmlFor="eventBadgeColor">Couleur du badge</label>
            <select id="eventBadgeColor" value={form.badgeColor} onChange={(e) => set("badgeColor", e.target.value)}>
              <option value="success">Vert</option>
              <option value="primary">Bleu</option>
              <option value="info">Cyan</option>
              <option value="warning">Jaune</option>
              <option value="danger">Rouge</option>
            </select>
          </div>
        </div>
        <div className="form-group full-width">
          <label htmlFor="eventDescription">Description</label>
          <textarea id="eventDescription" rows={4} value={form.description} onChange={(e) => set("description", e.target.value)} required />
        </div>
        <div className="form-group full-width">
          <label htmlFor="eventHighlights">Points forts (séparés par des virgules)</label>
          <input
            id="eventHighlights"
            type="text"
            placeholder="Ex: Stands recruteurs, Speed-recruiting"
            value={form.highlights}
            onChange={(e) => set("highlights", e.target.value)}
          />
        </div>
        <div className="visibility-toggle mb-3">
          <input
            id="eventRegistrationRequired"
            type="checkbox"
            checked={form.registrationRequired}
            onChange={(e) => set("registrationRequired", e.target.checked)}
          />
          <label htmlFor="eventRegistrationRequired" style={{ margin: 0 }}>Inscription requise</label>
        </div>
        <div className="form-actions">
          <button type="submit" className="btn-sala-primary" disabled={saving}>
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
