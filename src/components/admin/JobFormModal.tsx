// src/components/admin/JobFormModal.tsx
// Formulaire de création/édition d'une offre d'emploi (collection "emplois").
// Sert aussi d'écran de relecture pour une offre importée automatiquement
// (voir importRecord/onApproveImport) : l'admin peut corriger n'importe quel
// champ avant publication, elle n'est jamais écrite telle quelle.

"use client";

import { useEffect, useState, type FormEvent } from "react";
import { addDoc, collection, doc, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Modal } from "@/components/Modal";
import { notify } from "@/lib/notify";
import type { Job } from "@/types/job";
import type { ImportedJobRecord } from "@/hooks/useJobImports";

function dateInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

interface JobFormModalProps {
  open: boolean;
  job: Job | null;
  /** Offre importée à relire avant publication (voir page /admin/imports). */
  importRecord?: ImportedJobRecord | null;
  /** Si fourni, le formulaire publie via ce callback (puis marque l'import "approved") au lieu d'écrire directement dans "emplois". */
  onApproveImport?: (jobData: Record<string, unknown>) => Promise<void>;
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

export function JobFormModal({ open, job, importRecord, onApproveImport, onClose }: JobFormModalProps) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (job) {
      setForm({
        title: job.title || "",
        company: job.company || "",
        city: job.city || "",
        contract: job.contract || "",
        email: job.email || "",
        site: job.site || "",
        tel: job.tel || "",
        image: "",
        timestamp: job.timestamp?.toDate ? dateInputValue(job.timestamp.toDate()) : dateInputValue(new Date()),
        deadline: job.deadlineDate ? dateInputValue(job.deadlineDate) : "",
        languages: job.languages || "",
        competences: (job.competences || []).join(", "),
        body: job.body || "",
        visibility: !!job.visibility,
      });
    } else if (importRecord) {
      setForm({
        title: importRecord.title || "",
        company: importRecord.company || "",
        city: importRecord.city || "",
        contract: importRecord.contract || "",
        email: importRecord.email || "",
        site: importRecord.sourceUrl || "",
        tel: "",
        image: importRecord.logo || "",
        timestamp: dateInputValue(new Date()),
        deadline: importRecord.deadline ? dateInputValue(new Date(`${importRecord.deadline}T23:59:59`)) : "",
        languages: "",
        competences: "",
        body: importRecord.description || "",
        visibility: true,
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [open, job, importRecord]);

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
      if (onApproveImport) {
        await onApproveImport(jobData);
        notify("Offre publiée avec succès !");
      } else if (job) {
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
    <Modal
      open={open}
      onClose={onClose}
      title={job ? "Modifier l'offre" : importRecord ? "Vérifier avant de publier l'offre importée" : "Publier une nouvelle offre"}
    >
      <form className="job-form" onSubmit={handleSubmit}>
        {importRecord && (
          <p className="text-muted small mb-3">
            Offre importée depuis {importRecord.source.toUpperCase()} — relisez et corrigez les champs avant de publier.{" "}
            <a href={importRecord.sourceUrl} target="_blank" rel="noopener">
              Voir l&apos;annonce d&apos;origine <i className="fas fa-external-link-alt"></i>
            </a>
          </p>
        )}
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
            <input
              id="contract"
              type="text"
              list="contract-suggestions"
              placeholder="Ex: CDI, CDD, Stage..."
              value={form.contract}
              onChange={(e) => set("contract", e.target.value)}
              required
            />
            <datalist id="contract-suggestions">
              <option value="CDI" />
              <option value="CDD" />
              <option value="Stage" />
            </datalist>
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
