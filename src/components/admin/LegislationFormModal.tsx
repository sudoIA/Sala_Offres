// src/components/admin/LegislationFormModal.tsx
// Formulaire de création/édition d'une fiche Droit du Travail.

"use client";

import { useEffect, useState, type FormEvent } from "react";
import { addDoc, collection, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Modal } from "@/components/Modal";
import { notify } from "@/lib/notify";
import { TOPIC_LABELS, type LegislationFiche, type LegislationTopic } from "@/types/legislation";
import { withMobileFields } from "@/lib/legislation-mobile";
import { logAdminAction } from "@/lib/admin-log";
import { normalizeDashes } from "@/lib/dashes";

interface LegislationFormModalProps {
  open: boolean;
  fiche: LegislationFiche | null;
  nextOrder: number;
  onClose: () => void;
}

const EMPTY_FORM = {
  topic: "contrat" as LegislationTopic,
  topicLabel: "",
  articleRef: "",
  order: 1,
  title: "",
  intro: "",
  bodyHtml: "",
  faqQuestion: "",
  faqAnswer: "",
  sourceUrl: "",
  sourceLabel: "",
};

export function LegislationFormModal({ open, fiche, nextOrder, onClose }: LegislationFormModalProps) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm({
      topic: fiche?.topic || "contrat",
      topicLabel: fiche?.topicLabel || "",
      articleRef: fiche?.articleRef || "",
      order: fiche?.order || nextOrder,
      title: fiche?.title || "",
      intro: fiche?.intro || "",
      bodyHtml: fiche?.bodyHtml || "",
      faqQuestion: fiche?.faqQuestion || "",
      faqAnswer: fiche?.faqAnswer || "",
      sourceUrl: fiche?.sourceUrl || "",
      sourceLabel: fiche?.sourceLabel || "",
    });
  }, [open, fiche, nextOrder]);

  function set<K extends keyof typeof EMPTY_FORM>(key: K, value: (typeof EMPTY_FORM)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    // description et readingTime (lus par l'app mobile) sont recalculés.
    const data = withMobileFields(normalizeDashes({
      topic: form.topic,
      topicLabel: form.topicLabel.trim(),
      articleRef: form.articleRef.trim(),
      order: form.order || 1,
      title: form.title.trim(),
      intro: form.intro.trim(),
      bodyHtml: form.bodyHtml.trim(),
      faqQuestion: form.faqQuestion.trim(),
      faqAnswer: form.faqAnswer.trim(),
      sourceUrl: form.sourceUrl.trim(),
      sourceLabel: form.sourceLabel.trim(),
    }));

    try {
      if (fiche) {
        await updateDoc(doc(db, "legislation", fiche.id), data);
        await logAdminAction("update", "legislation", String(data.title || "Fiche"), fiche.id);
        notify("Fiche mise à jour.");
      } else {
        const ref = await addDoc(collection(db, "legislation"), data);
        await logAdminAction("create", "legislation", String(data.title || "Fiche"), ref.id);
        notify("Fiche ajoutée avec succès !");
      }
      onClose();
    } catch (err) {
      console.error("Erreur enregistrement fiche législation :", err);
      notify("Erreur : " + (err as Error).message, "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={fiche ? "Modifier la fiche" : "Ajouter une fiche"}>
      <form className="job-form" onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="legTopic">Thème (filtre affiché sur la page)</label>
            <select id="legTopic" value={form.topic} onChange={(e) => set("topic", e.target.value as LegislationTopic)} required>
              {(Object.keys(TOPIC_LABELS) as LegislationTopic[]).map((key) => (
                <option key={key} value={key}>{TOPIC_LABELS[key]}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="legTopicLabel">Étiquette affichée</label>
            <input id="legTopicLabel" type="text" placeholder="Ex: Contrat de Travail" value={form.topicLabel} onChange={(e) => set("topicLabel", e.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="legArticleRef">Référence d&apos;article</label>
            <input id="legArticleRef" type="text" placeholder="Ex: Art. 10 à 35" value={form.articleRef} onChange={(e) => set("articleRef", e.target.value)} />
          </div>
          <div className="form-group">
            <label htmlFor="legOrder">Ordre d&apos;affichage</label>
            <input id="legOrder" type="number" min={1} value={form.order} onChange={(e) => set("order", parseInt(e.target.value, 10) || 1)} />
          </div>
        </div>
        <div className="form-group full-width">
          <label htmlFor="legTitle">Titre de la fiche</label>
          <input id="legTitle" type="text" value={form.title} onChange={(e) => set("title", e.target.value)} required />
        </div>
        <div className="form-group full-width">
          <label htmlFor="legIntro">Introduction (1-2 phrases)</label>
          <textarea id="legIntro" rows={2} value={form.intro} onChange={(e) => set("intro", e.target.value)} />
        </div>
        <div className="form-group full-width">
          <label htmlFor="legBody">
            Contenu détaillé (HTML autorisé : &lt;div class=&quot;law-highlight&quot;&gt; ou &lt;div class=&quot;law-warning&quot;&gt; pour les encarts colorés)
          </label>
          <textarea
            id="legBody"
            rows={7}
            placeholder='<div class="law-highlight"><strong>Point clé :</strong><p class="mb-0 mt-1 small text-muted">...</p></div>'
            value={form.bodyHtml}
            onChange={(e) => set("bodyHtml", e.target.value)}
          />
        </div>
        <div className="form-grid">
          <div className="form-group full-width">
            <label htmlFor="legFaqQuestion">Question FAQ (optionnel)</label>
            <input id="legFaqQuestion" type="text" value={form.faqQuestion} onChange={(e) => set("faqQuestion", e.target.value)} />
          </div>
          <div className="form-group full-width">
            <label htmlFor="legFaqAnswer">Réponse FAQ (optionnel)</label>
            <textarea id="legFaqAnswer" rows={2} value={form.faqAnswer} onChange={(e) => set("faqAnswer", e.target.value)} />
          </div>
          <div className="form-group">
            <label htmlFor="legSourceUrl">Lien vers la source (optionnel)</label>
            <input id="legSourceUrl" type="url" placeholder="https://..." value={form.sourceUrl} onChange={(e) => set("sourceUrl", e.target.value)} />
          </div>
          <div className="form-group">
            <label htmlFor="legSourceLabel">Nom de la source</label>
            <input id="legSourceLabel" type="text" placeholder="Ex : Code du travail (sgg.cg)" value={form.sourceLabel} onChange={(e) => set("sourceLabel", e.target.value)} />
          </div>
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
