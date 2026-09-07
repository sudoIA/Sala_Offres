// src/components/cv/steps/Step1Personal.tsx
// Étape 1 : informations personnelles + photo de profil. Les 4 champs
// essentiels (nom, poste, email, téléphone) sont requis pour avancer.

"use client";

import { useRef } from "react";
import type { CvPersonalInfo } from "@/types/cv";

const CITIES = ["Brazzaville", "Pointe-Noire", "Dolisie", "Nkayi", "Oyo", "Autre localité"];

interface Step1PersonalProps {
  personal: CvPersonalInfo;
  invalidFields: Set<string>;
  onChange: (patch: Partial<CvPersonalInfo>) => void;
  onFieldTouched: (field: string) => void;
}

export function Step1Personal({ personal, invalidFields, onChange, onFieldTouched }: Step1PersonalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => onChange({ photo: ev.target?.result as string });
    reader.readAsDataURL(file);
  }

  function removePhoto() {
    onChange({ photo: null });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function field(id: keyof CvPersonalInfo, required = false) {
    return {
      value: personal[id] as string,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        onChange({ [id]: e.target.value } as Partial<CvPersonalInfo>);
        if (required && e.target.value.trim()) onFieldTouched(id);
      },
      className: `form-control${required && invalidFields.has(id) ? " is-invalid" : ""}`,
    };
  }

  return (
    <div className="step-pane cv-card">
      <h3 className="h4 fw-bold mb-1 text-dark">Informations personnelles</h3>
      <p className="text-muted small mb-4">Ces informations permettront aux recruteurs congolais de vous contacter directement.</p>

      <div className="row align-items-center mb-4">
        <div className="col-auto">
          <div className="avatar-upload-box" onClick={() => fileInputRef.current?.click()} title="Cliquer pour ajouter une photo">
            {personal.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={personal.photo} alt="Aperçu photo" />
            ) : (
              <div className="text-center p-2 text-muted">
                <i className="fas fa-camera fa-2x mb-1 text-success"></i>
                <div style={{ fontSize: "0.72rem", fontWeight: 600 }}>Ajouter photo</div>
              </div>
            )}
          </div>
          <input type="file" ref={fileInputRef} accept="image/*" style={{ display: "none" }} onChange={handlePhotoChange} />
        </div>
        <div className="col">
          <label className="form-label small fw-bold">Photo de profil (Recommandée)</label>
          <p className="text-muted small mb-2">Un portrait soigné et souriant valorise votre candidature auprès des entreprises.</p>
          {personal.photo && (
            <button type="button" className="btn btn-sm btn-outline-danger" onClick={removePhoto}>
              <i className="fas fa-trash me-1"></i> Supprimer la photo
            </button>
          )}
        </div>
      </div>

      <div className="row">
        <div className="col-md-6 mb-3">
          <label htmlFor="fullName" className="form-label small fw-bold">Nom complet *</label>
          <input type="text" id="fullName" placeholder="Ex: Jean Paul MOUKOKO" {...field("fullName", true)} />
          <div className="invalid-feedback">Merci d&apos;indiquer votre nom complet — il est indispensable sur un CV.</div>
        </div>
        <div className="col-md-6 mb-3">
          <label htmlFor="jobTitle" className="form-label small fw-bold">Titre du poste recherché *</label>
          <input type="text" id="jobTitle" placeholder="Ex: Comptable Junior, Chauffeur, Développeur Web" {...field("jobTitle", true)} />
          <div className="invalid-feedback">Indiquez le poste recherché pour orienter votre candidature.</div>
        </div>
      </div>

      <div className="row">
        <div className="col-md-6 mb-3">
          <label htmlFor="email" className="form-label small fw-bold">Adresse Email *</label>
          <input type="email" id="email" placeholder="nom@exemple.cg" {...field("email", true)} />
          <div className="invalid-feedback">Une adresse email valide est nécessaire pour que les recruteurs vous contactent.</div>
        </div>
        <div className="col-md-6 mb-3">
          <label htmlFor="phone" className="form-label small fw-bold">Numéro de téléphone *</label>
          <input type="tel" id="phone" placeholder="+242 06 ... / 05 ..." {...field("phone", true)} />
          <div className="invalid-feedback">Un numéro de téléphone est nécessaire pour que les recruteurs vous joignent.</div>
        </div>
      </div>

      <div className="row">
        <div className="col-md-6 mb-3">
          <label htmlFor="city" className="form-label small fw-bold">Ville de résidence *</label>
          <select id="city" className="form-select" value={personal.city} onChange={(e) => onChange({ city: e.target.value })}>
            {CITIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="col-md-6 mb-3">
          <label htmlFor="address" className="form-label small fw-bold">Adresse / Quartier</label>
          <input type="text" id="address" placeholder="Ex: Moungali, Poto-Poto, Tié-Tié..." {...field("address")} />
        </div>
      </div>

      <div className="mb-3">
        <label htmlFor="bio" className="form-label small fw-bold">Objectif professionnel / Profil en résumé</label>
        <textarea
          id="bio"
          className="form-control"
          rows={3}
          placeholder="Présentez en 2 ou 3 phrases vos atouts, votre motivation et ce que vous apportez à l'entreprise..."
          value={personal.bio}
          onChange={(e) => onChange({ bio: e.target.value })}
        />
      </div>
    </div>
  );
}
