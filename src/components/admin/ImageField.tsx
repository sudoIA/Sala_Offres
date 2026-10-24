// src/components/admin/ImageField.tsx
// Champ d'image du back-office (logo, photo) : une URL ou un nom de fichier
// Storage saisi à la main comme avant, ou une image envoyée depuis
// l'ordinateur (voir storage-upload.ts), avec un aperçu.

"use client";

import { useRef, useState } from "react";
import { uploadPublicImage } from "@/lib/storage-upload";
import { notify } from "@/lib/notify";

interface ImageFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** Dossier Storage ("entreprises", "universites"...). */
  folder: string;
  /** Sert à nommer le fichier envoyé (ex : nom de l'entreprise). */
  nameHint: string;
}

export function ImageField({ label, value, onChange, folder, nameHint }: ImageFieldProps) {
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const preview = /^https?:\/\//i.test(value) ? value : null;

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    try {
      onChange(await uploadPublicImage(folder, file, nameHint));
      notify("Image envoyée. Pensez à enregistrer la fiche.");
    } catch (err) {
      notify((err as Error).message, "error");
    } finally {
      setUploading(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div className="form-group">
      <label>{label}</label>
      <div className="image-field">
        {preview && (
          // eslint-disable-next-line @next/next/no-img-element -- aperçu d'une URL quelconque, hors optimisation Next
          <img src={preview} alt="" className="image-field-preview" />
        )}
        <input type="text" placeholder="https://... ou nom du fichier" value={value} onChange={(e) => onChange(e.target.value)} />
        <button type="button" className="btn btn-outline-secondary btn-sm rounded-pill text-nowrap" disabled={uploading} onClick={() => input.current?.click()}>
          <i className={`fas ${uploading ? "fa-spinner fa-spin" : "fa-upload"} me-1`}></i>
          {uploading ? "Envoi..." : "Envoyer"}
        </button>
        <input ref={input} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif" hidden onChange={(e) => handleFile(e.target.files?.[0])} />
      </div>
    </div>
  );
}
