// src/components/admin/EventFormModal.tsx
// Formulaire de création/édition d'un événement (collection Firestore
// "events", partagée avec l'app mobile — les noms de champs ci-dessous
// reprennent exactement les siens : title, body, host, city, site, image,
// deadline, deadline2, visibility. "resume" est propre au site web (aperçu
// sur la carte de la liste, distinct de la description complète "body").

"use client";

import { useEffect, useState, type FormEvent } from "react";
import { addDoc, collection, doc, Timestamp, updateDoc } from "firebase/firestore";
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
  host: "",
  city: "",
  resume: "",
  body: "",
  site: "",
  image: "",
  deadline: "",
  deadline2: "",
  visibility: true,
};

/** Formate une Date en valeur compatible avec un input datetime-local. */
function toDatetimeLocal(date: Date | null): string {
  if (!date) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function EventFormModal({ open, event, onClose }: EventFormModalProps) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm({
      title: event?.title || "",
      host: event?.host || "",
      city: event?.city || "",
      resume: event?.resume || "",
      body: event?.body || "",
      site: event?.site || "",
      image: event?.image || "",
      deadline: toDatetimeLocal(event?.deadlineDate || null),
      deadline2: toDatetimeLocal(event?.deadline2Date || null),
      visibility: event ? event.visibility !== false : true,
    });
  }, [open, event]);

  function set<K extends keyof typeof EMPTY_FORM>(key: K, value: (typeof EMPTY_FORM)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);

    const eventData: Record<string, unknown> = {
      title: form.title.trim(),
      host: form.host.trim(),
      city: form.city.trim(),
      resume: form.resume.trim(),
      body: form.body.trim(),
      site: form.site.trim(),
      image: form.image.trim(),
      deadline: form.deadline ? Timestamp.fromDate(new Date(form.deadline)) : null,
      deadline2: form.deadline2 ? Timestamp.fromDate(new Date(form.deadline2)) : null,
      visibility: form.visibility,
    };
    if (!event) eventData.timestamp = Timestamp.now();

    try {
      if (event) {
        await updateDoc(doc(db, "events", event.id), eventData);
        notify("Événement mis à jour.");
      } else {
        await addDoc(collection(db, "events"), eventData);
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
            <label htmlFor="eventHost">Organisateur</label>
            <input id="eventHost" type="text" value={form.host} onChange={(e) => set("host", e.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="eventCity">Ville</label>
            <input id="eventCity" type="text" value={form.city} onChange={(e) => set("city", e.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="eventDeadline">Date &amp; heure de début</label>
            <input id="eventDeadline" type="datetime-local" value={form.deadline} onChange={(e) => set("deadline", e.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="eventDeadline2">Date &amp; heure de fin (optionnel)</label>
            <input id="eventDeadline2" type="datetime-local" value={form.deadline2} onChange={(e) => set("deadline2", e.target.value)} />
          </div>
          <div className="form-group">
            <label htmlFor="eventSite">Lien (site, groupe WhatsApp...)</label>
            <input id="eventSite" type="url" placeholder="https://..." value={form.site} onChange={(e) => set("site", e.target.value)} />
          </div>
          <div className="form-group">
            <label htmlFor="eventImage">Image (nom de fichier ou URL, optionnel)</label>
            <input
              id="eventImage"
              type="text"
              placeholder="Ex: eco, ou https://..."
              value={form.image}
              onChange={(e) => set("image", e.target.value)}
            />
          </div>
        </div>
        <div className="form-group full-width">
          <label htmlFor="eventResume">Résumé (affiché sur la carte)</label>
          <textarea
            id="eventResume"
            rows={2}
            placeholder="2-3 lignes maximum, pour l'aperçu dans la liste des événements."
            value={form.resume}
            onChange={(e) => set("resume", e.target.value)}
          />
        </div>
        <div className="form-group full-width">
          <label htmlFor="eventBody">Description complète (affichée quand on ouvre l&apos;événement)</label>
          <textarea id="eventBody" rows={5} value={form.body} onChange={(e) => set("body", e.target.value)} required />
        </div>
        <div className="visibility-toggle mb-3">
          <input
            id="eventVisibility"
            type="checkbox"
            checked={form.visibility}
            onChange={(e) => set("visibility", e.target.checked)}
          />
          <label htmlFor="eventVisibility" style={{ margin: 0 }}>Visible sur le site</label>
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
