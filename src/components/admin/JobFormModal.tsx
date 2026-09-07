// src/components/admin/JobFormModal.tsx
// Formulaire de création/édition d'une offre d'emploi (collection "emplois").

"use client";

import { useEffect, useState, type FormEvent } from "react";
import { addDoc, collection, doc, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Modal } from "@/components/Modal";
import { notify } from "@/lib/notify";
import type { Job } from "@/types/job";

function dateInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

interface JobFormModalProps {
  open: boolean;
  job: Job | null;
  onClose: () => void;
}

const EMPTY_FORM = {
  title: "",
  company: "",
  city: "",
  contract: "",
  email: "",
  site: "",
  tel: "",
  image: "",
  timestamp: dateInputValue(new Date()),
  deadline: "",
  languages: "",
  competences: "",
  body: "",
  visibility: true,
};

export function JobFormModal({ open, job, onClose }: JobFormModalProps) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm({
      title: job?.title || "",
      company: job?.company || "",
      city: job?.city || "",
      contract: job?.contract || "",
      email: job?.email || "",
      site: job?.site || "",
      tel: job?.tel || "",
      image: "",
      timestamp: job?.timestamp?.toDate ? dateInputValue(job.timestamp.toDate()) : dateInputValue(new Date()),
      deadline: job?.deadlineDate ? dateInputValue(job.deadlineDate) : "",
      languages: job?.languages || "",
      competences: (job?.competences || []).join(", "),
      body: job?.body || "",
      visibility: job ? !!job.visibility : true,
    });
  }, [open, job]);

  function set<K extends keyof typeof EMPTY_FORM>(key: K, value: (typeof EMPTY_FORM)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    const jobData = {
      title: form.title.trim(),
      company: form.company.trim(),
      city: form.city.trim(),
      email: form.email.trim(),
      contract: form.contract,
      timestamp: form.timestamp ? Timestamp.fromDate(new Date(form.timestamp)) : Timestamp.now(),
      deadline: form.deadline ? Timestamp.fromDate(new Date(form.deadline)) : Timestamp.now(),
      body: form.body.trim(),
      languages: form.languages.trim() || null,
      competences: form.competences.split(",").map((s) => s.trim()).filter(Boolean),
      visibility: form.visibility,
      site: form.site.trim() || null,
      image: form.image.trim() || null,
      tel: form.tel.trim() || null,
    };

    try {
      if (job) {
        await updateDoc(doc(db, "emplois", job.id), jobData);
        notify("Offre mise à jour.");
      } else {
        await addDoc(collection(db, "emplois"), jobData);
        notify("Offre publiée avec succès !");
      }
      onClose();
    } catch (err) {
      console.error("Erreur publication offre :", err);
      notify("Erreur : " + (err as Error).message, "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={job ? "Modifier l'offre" : "Publier une nouvelle offre"}>
      <form className="job-form" onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="title">Titre</label>
            <input id="title" type="text" value={form.title} onChange={(e) => set("title", e.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="company">Entreprise</label>
            <input id="company" type="text" value={form.company} onChange={(e) => set("company", e.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="city">Ville</label>
            <input id="city" type="text" value={form.city} onChange={(e) => set("city", e.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="contract">Contrat</label>
            <select id="contract" value={form.contract} onChange={(e) => set("contract", e.target.value)} required>
              <option value="">Sélectionner</option>
              <option value="CDI">CDI</option>
              <option value="CDD">CDD</option>
              <option value="Stage">Stage</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="jobEmail">Email de contact</label>
            <input id="jobEmail" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="site">Site Web</label>
            <input id="site" type="url" value={form.site} onChange={(e) => set("site", e.target.value)} />
          </div>
          <div className="form-group">
            <label htmlFor="tel">Téléphone</label>
            <input id="tel" type="tel" value={form.tel} onChange={(e) => set("tel", e.target.value)} />
          </div>
          <div className="form-group">
            <label htmlFor="image">Image (URL)</label>
            <input id="image" type="url" value={form.image} onChange={(e) => set("image", e.target.value)} />
          </div>
          <div className="form-group">
            <label htmlFor="timestamp">Date de publication</label>
            <input id="timestamp" type="datetime-local" value={form.timestamp} onChange={(e) => set("timestamp", e.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="deadline">Date limite</label>
            <input id="deadline" type="datetime-local" value={form.deadline} onChange={(e) => set("deadline", e.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="languages">Exigences linguistiques</label>
            <input
              id="languages"
              type="text"
              placeholder="Ex: Français (courant), Anglais (intermédiaire)"
              value={form.languages}
              onChange={(e) => set("languages", e.target.value)}
            />
          </div>
        </div>
        <div className="form-group full-width">
          <label htmlFor="body">Description de l&apos;offre</label>
          <textarea id="body" rows={6} value={form.body} onChange={(e) => set("body", e.target.value)} required />
        </div>
        <div className="form-group full-width">
          <label htmlFor="competences">Compétences requises (séparées par des virgules)</label>
          <input
            id="competences"
            type="text"
            placeholder="Ex: Excel, Gestion de caisse, Communication"
            value={form.competences}
            onChange={(e) => set("competences", e.target.value)}
          />
        </div>
        <div className="visibility-toggle mb-3">
          <input id="visibility" type="checkbox" checked={form.visibility} onChange={(e) => set("visibility", e.target.checked)} />
          <label htmlFor="visibility" style={{ margin: 0 }}>Offre visible publiquement</label>
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
