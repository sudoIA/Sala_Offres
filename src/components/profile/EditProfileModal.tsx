// src/components/profile/EditProfileModal.tsx
// Formulaire de modification du profil candidat.

"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Modal } from "@/components/Modal";
import type { ProfileUpdateData } from "@/lib/candidate-profile";
import type { UserProfile } from "@/types/user-profile";

const CITIES = ["Brazzaville", "Pointe-Noire", "Dolisie", "Nkayi", "Oyo", "Autre"];

interface EditProfileModalProps {
  open: boolean;
  profile: UserProfile | null;
  onClose: () => void;
  onSave: (data: ProfileUpdateData) => Promise<void>;
}

export function EditProfileModal({ open, profile, onClose, onSave }: EditProfileModalProps) {
  const [fullName, setFullName] = useState("");
  const [city, setCity] = useState("Brazzaville");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setFullName(profile?.fullName || "");
    setCity(profile?.city || "Brazzaville");
    setPhone(profile?.phone || "");
    setBio(profile?.bio || "");
    setSkills((profile?.skills || []).join(", "));
  }, [open, profile]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        fullName: fullName.trim(),
        city,
        phone: phone.trim(),
        bio: bio.trim(),
        skills: skills.split(",").map((s) => s.trim()).filter(Boolean),
      });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Modifier mes informations" size="md">
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label small fw-bold">Nom complet</label>
          <input type="text" className="form-control" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        <div className="row">
          <div className="col-6 mb-3">
            <label className="form-label small fw-bold">Ville</label>
            <select className="form-select" value={city} onChange={(e) => setCity(e.target.value)}>
              {CITIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="col-6 mb-3">
            <label className="form-label small fw-bold">Téléphone</label>
            <input type="tel" className="form-control" placeholder="+242..." value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
        </div>
        <div className="mb-3">
          <label className="form-label small fw-bold">Bio / Objectif professionnel</label>
          <textarea className="form-control" rows={3} placeholder="Présentez brièvement vos atouts et votre recherche d'emploi..." value={bio} onChange={(e) => setBio(e.target.value)} />
        </div>
        <div className="mb-3">
          <label className="form-label small fw-bold">Compétences (séparées par des virgules)</label>
          <input type="text" className="form-control" placeholder="Ex: Comptabilité, Excel, Vente, Permis B" value={skills} onChange={(e) => setSkills(e.target.value)} />
        </div>
        <div className="d-flex justify-content-end gap-2 mt-4">
          <button type="button" className="btn btn-light rounded-pill px-3" onClick={onClose}>Annuler</button>
          <button type="submit" className="btn-sala-primary rounded-pill px-4" disabled={saving}>
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
