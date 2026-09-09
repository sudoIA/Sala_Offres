// src/components/admin/AnnuaireFormModal.tsx
// Formulaire de création/édition d'une fiche annuaire. Les champs affichés
// dépendent de la catégorie (universités / entreprises / clubs d'anglais).

"use client";

import { useEffect, useState, type FormEvent } from "react";
import { addDoc, collection, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Modal } from "@/components/Modal";
import { notify } from "@/lib/notify";
import { ANNUAIRE_COLLECTIONS, type AnnuaireCategory, type AnnuaireItem } from "@/types/annuaire";

interface AnnuaireFormModalProps {
  open: boolean;
  category: AnnuaireCategory;
  item: AnnuaireItem | null;
  onClose: () => void;
}

const CATEGORY_LABELS: Record<AnnuaireCategory, string> = {
  universities: "une université/école",
  companies: "une entreprise",
  clubs: "un club d'anglais",
};

const EMPTY_FORM = {
  name: "",
  type: "",
  city: "",
  address: "",
  phone: "",
  email: "",
  website: "",
  faculties: "",
  sector: "",
  services: "",
  description: "",
  location: "",
  schedule: "",
  coordinator: "",
  fee: "",
  activities: "",
  logo: "",
  summary: "",
};

export function AnnuaireFormModal({ open, category, item, onClose }: AnnuaireFormModalProps) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [verified, setVerified] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setVerified(item?.verified || false);
    setForm({
      name: item?.name || "",
      type: item?.type || "",
      city: item?.city || "",
      address: item?.address || "",
      phone: item?.phone || "",
      email: item?.email || "",
      website: item?.website || "",
      faculties: (item?.faculties || []).join(", "),
      sector: item?.sector || "",
      services: (item?.services || []).join(", "),
      description: item?.description || "",
      location: item?.location || "",
      schedule: item?.schedule || "",
      coordinator: item?.coordinator || "",
      fee: item?.fee || "",
      activities: (item?.activities || []).join(", "),
      logo: item?.logo || "",
      summary: item?.summary || "",
    });
  }, [open, item]);

  function set<K extends keyof typeof EMPTY_FORM>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    const colName = ANNUAIRE_COLLECTIONS[category];

    let data: Record<string, unknown>;
    if (category === "universities") {
      data = {
        name: form.name.trim(),
        type: form.type.trim(),
        city: form.city.trim(),
        address: form.address.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        website: form.website.trim(),
        faculties: form.faculties.split(",").map((s) => s.trim()).filter(Boolean),
        logo: form.logo.trim(),
        summary: form.summary.trim(),
        description: form.description.trim(),
      };
    } else if (category === "companies") {
      data = {
        name: form.name.trim(),
        sector: form.sector.trim(),
        city: form.city.trim(),
        address: form.address.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        website: form.website.trim(),
        description: form.description.trim(),
        services: form.services.split(",").map((s) => s.trim()).filter(Boolean),
        logo: form.logo.trim(),
        summary: form.summary.trim(),
      };
    } else {
      data = {
        name: form.name.trim(),
        type: form.type.trim(),
        city: form.city.trim(),
        location: form.location.trim(),
        schedule: form.schedule.trim(),
        coordinator: form.coordinator.trim(),
        phone: form.phone.trim(),
        fee: form.fee.trim(),
        description: form.description.trim(),
        activities: form.activities.split(",").map((s) => s.trim()).filter(Boolean),
        logo: form.logo.trim(),
        summary: form.summary.trim(),
      };
    }
    data.verified = verified;

    try {
      if (item) {
        await updateDoc(doc(db, colName, item.id), data);
        notify("Fiche mise à jour.");
      } else {
        await addDoc(collection(db, colName), data);
        notify("Fiche ajoutée avec succès !");
      }
      onClose();
    } catch (err) {
      console.error("Erreur enregistrement fiche :", err);
      notify("Erreur : " + (err as Error).message, "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={item ? "Modifier la fiche" : `Ajouter ${CATEGORY_LABELS[category]}`}>
      <form className="job-form" onSubmit={handleSubmit}>
        {category === "universities" && (
          <>
            <div className="form-grid">
              <div className="form-group"><label>Nom</label><input type="text" value={form.name} onChange={(e) => set("name", e.target.value)} required /></div>
              <div className="form-group"><label>Type</label><input type="text" placeholder="Université Publique, Institut Supérieur..." value={form.type} onChange={(e) => set("type", e.target.value)} /></div>
              <div className="form-group"><label>Ville</label><input type="text" value={form.city} onChange={(e) => set("city", e.target.value)} required /></div>
              <div className="form-group"><label>Adresse</label><input type="text" value={form.address} onChange={(e) => set("address", e.target.value)} /></div>
              <div className="form-group"><label>Téléphone</label><input type="text" value={form.phone} onChange={(e) => set("phone", e.target.value)} /></div>
              <div className="form-group"><label>Email</label><input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} /></div>
              <div className="form-group"><label>Site Web</label><input type="url" value={form.website} onChange={(e) => set("website", e.target.value)} /></div>
              <div className="form-group"><label>Logo (URL de l&apos;image)</label><input type="url" placeholder="https://..." value={form.logo} onChange={(e) => set("logo", e.target.value)} /></div>
            </div>
            <div className="form-group full-width">
              <label>Résumé (1-2 phrases, affiché sur la carte)</label>
              <input type="text" maxLength={160} value={form.summary} onChange={(e) => set("summary", e.target.value)} />
            </div>
            <div className="form-group full-width">
              <label>Filières &amp; Départements (séparés par des virgules)</label>
              <input type="text" value={form.faculties} onChange={(e) => set("faculties", e.target.value)} />
            </div>
            <div className="form-group full-width">
              <label>Description complète (affichée dans le détail)</label>
              <textarea rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} />
            </div>
          </>
        )}

        {category === "companies" && (
          <>
            <div className="form-grid">
              <div className="form-group"><label>Nom</label><input type="text" value={form.name} onChange={(e) => set("name", e.target.value)} required /></div>
              <div className="form-group"><label>Secteur</label><input type="text" value={form.sector} onChange={(e) => set("sector", e.target.value)} required /></div>
              <div className="form-group"><label>Ville</label><input type="text" value={form.city} onChange={(e) => set("city", e.target.value)} required /></div>
              <div className="form-group"><label>Adresse</label><input type="text" value={form.address} onChange={(e) => set("address", e.target.value)} /></div>
              <div className="form-group"><label>Téléphone</label><input type="text" value={form.phone} onChange={(e) => set("phone", e.target.value)} /></div>
              <div className="form-group"><label>Email RH</label><input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} /></div>
              <div className="form-group"><label>Site Web</label><input type="url" value={form.website} onChange={(e) => set("website", e.target.value)} /></div>
              <div className="form-group"><label>Logo (URL de l&apos;image)</label><input type="url" placeholder="https://..." value={form.logo} onChange={(e) => set("logo", e.target.value)} /></div>
            </div>
            <div className="form-group full-width">
              <label>Résumé (1-2 phrases, affiché sur la carte)</label>
              <input type="text" maxLength={160} value={form.summary} onChange={(e) => set("summary", e.target.value)} />
            </div>
            <div className="form-group full-width">
              <label>Domaines d&apos;activité (séparés par des virgules)</label>
              <input type="text" placeholder="Recrutement, Stages, Alternance..." value={form.services} onChange={(e) => set("services", e.target.value)} />
            </div>
            <div className="form-group full-width">
              <label>Description complète (affichée dans le détail)</label>
              <textarea rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} />
            </div>
          </>
        )}

        {category === "clubs" && (
          <>
            <div className="form-grid">
              <div className="form-group"><label>Nom</label><input type="text" value={form.name} onChange={(e) => set("name", e.target.value)} required /></div>
              <div className="form-group"><label>Type</label><input type="text" placeholder="Club communautaire, universitaire..." value={form.type} onChange={(e) => set("type", e.target.value)} /></div>
              <div className="form-group"><label>Ville</label><input type="text" value={form.city} onChange={(e) => set("city", e.target.value)} required /></div>
              <div className="form-group"><label>Lieu</label><input type="text" value={form.location} onChange={(e) => set("location", e.target.value)} /></div>
              <div className="form-group"><label>Horaire</label><input type="text" placeholder="Chaque samedi de 15h00 à 17h30" value={form.schedule} onChange={(e) => set("schedule", e.target.value)} /></div>
              <div className="form-group"><label>Coordinateur</label><input type="text" value={form.coordinator} onChange={(e) => set("coordinator", e.target.value)} /></div>
              <div className="form-group"><label>Téléphone</label><input type="text" value={form.phone} onChange={(e) => set("phone", e.target.value)} /></div>
              <div className="form-group"><label>Tarif</label><input type="text" placeholder="Gratuit, Adhésion libre..." value={form.fee} onChange={(e) => set("fee", e.target.value)} /></div>
              <div className="form-group"><label>Logo (URL de l&apos;image)</label><input type="url" placeholder="https://..." value={form.logo} onChange={(e) => set("logo", e.target.value)} /></div>
            </div>
            <div className="form-group full-width">
              <label>Résumé (1-2 phrases, affiché sur la carte)</label>
              <input type="text" maxLength={160} value={form.summary} onChange={(e) => set("summary", e.target.value)} />
            </div>
            <div className="form-group full-width">
              <label>Activités proposées (séparées par des virgules)</label>
              <input type="text" placeholder="Conversation, Préparation TOEFL, Théâtre..." value={form.activities} onChange={(e) => set("activities", e.target.value)} />
            </div>
            <div className="form-group full-width">
              <label>Description complète (affichée dans le détail)</label>
              <textarea rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} />
            </div>
          </>
        )}

        <label className="visibility-toggle mb-3">
          <input type="checkbox" checked={verified} onChange={(e) => setVerified(e.target.checked)} />
          Partenaire vérifié Sala (affiche un badge de confiance sur la fiche publique)
        </label>

        <div className="form-actions">
          <button type="submit" className="btn-sala-primary" disabled={saving}>
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
