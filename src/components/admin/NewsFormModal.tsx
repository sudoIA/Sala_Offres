// src/components/admin/NewsFormModal.tsx
// Formulaire de création/édition d'un article News Sala.

"use client";

import { useEffect, useState, type FormEvent } from "react";
import DOMPurify from "isomorphic-dompurify";
import { addDoc, collection, doc, Timestamp, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Modal } from "@/components/Modal";
import { notify } from "@/lib/notify";
import { logAdminAction } from "@/lib/admin-log";
import { formatJobBody } from "@/lib/job-body";
import { safeExternalUrl } from "@/lib/safe-url";
import type { NewsArticle } from "@/types/news";

interface NewsFormModalProps {
  open: boolean;
  article: NewsArticle | null;
  onClose: () => void;
}

const EMPTY_FORM = { title: "", summary: "", body: "", image: "", visibility: true };

export function NewsFormModal({ open, article, onClose }: NewsFormModalProps) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm({
      title: article?.title || "",
      summary: article?.summary || "",
      body: article?.body || "",
      image: article?.image || "",
      visibility: article ? article.visibility !== false : true,
    });
  }, [open, article]);

  function set<K extends keyof typeof EMPTY_FORM>(key: K, value: (typeof EMPTY_FORM)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const image = form.image.trim();
    if (image && !safeExternalUrl(image)) {
      notify("L'adresse de l'image doit commencer par https://", "error");
      return;
    }
    setSaving(true);
    const data = {
      title: form.title.trim(),
      summary: form.summary.trim(),
      body: form.body.trim(),
      image: image || null,
      visibility: form.visibility,
    };
    try {
      if (article) {
        await updateDoc(doc(db, "news", article.id), data);
        await logAdminAction("update", "news", data.title, article.id);
        notify("Article mis à jour.");
      } else {
        const ref = await addDoc(collection(db, "news"), { ...data, publishedAt: Timestamp.now() });
        await logAdminAction("create", "news", data.title, ref.id);
        notify("Article publié !");
      }
      onClose();
    } catch (err) {
      console.error("Erreur enregistrement de l'article :", err);
      notify("Erreur : " + (err as Error).message, "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={article ? "Modifier l'article" : "Nouvel article"}>
      <form className="job-form" onSubmit={handleSubmit}>
        <div className="form-group full-width">
          <label htmlFor="newsTitle">Titre</label>
          <input id="newsTitle" type="text" maxLength={150} value={form.title} onChange={(e) => set("title", e.target.value)} required />
        </div>
        <div className="form-group full-width">
          <label htmlFor="newsSummary">Résumé (affiché sur la carte, 1-2 phrases)</label>
          <textarea id="newsSummary" rows={2} maxLength={300} value={form.summary} onChange={(e) => set("summary", e.target.value)} required />
        </div>
        <div className="form-group full-width">
          <label htmlFor="newsBody">Contenu (sauts de ligne conservés ; HTML simple accepté : &lt;b&gt;, &lt;br&gt;, listes)</label>
          <textarea id="newsBody" rows={8} value={form.body} onChange={(e) => set("body", e.target.value)} required />
          {form.body.trim() && (
            <details className="job-body-preview">
              <summary>Aperçu tel qu&apos;affiché sur le site</summary>
              <div className="sala-job-body" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(formatJobBody(form.body)) }} />
            </details>
          )}
        </div>
        <div className="form-group full-width">
          <label htmlFor="newsImage">Image d&apos;illustration (adresse https://, facultatif)</label>
          <input id="newsImage" type="url" placeholder="https://..." value={form.image} onChange={(e) => set("image", e.target.value)} />
        </div>
        <div className="visibility-toggle mb-3">
          <input id="newsVisibility" type="checkbox" checked={form.visibility} onChange={(e) => set("visibility", e.target.checked)} />
          <label htmlFor="newsVisibility" style={{ margin: 0 }}>Article visible publiquement</label>
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
