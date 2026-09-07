// src/components/cv/steps/Step5Skills.tsx
// Étape 5 : compétences clés + loisirs/centres d'intérêt (champs texte
// "séparés par des virgules" avec suggestions cliquables).

"use client";

import { useEffect, useState } from "react";

const SUGGESTED_SKILLS = ["Pack Office", "Gestion de caisse", "Communication", "Service client", "Gestion des stocks"];
const SUGGESTED_HOBBIES = ["Football", "Lecture", "Bénévolat associatif", "Musique", "Voyages"];

interface Step5Props {
  skills: string[];
  hobbies: string[];
  onSkillsChange: (skills: string[]) => void;
  onHobbiesChange: (hobbies: string[]) => void;
}

function parseCsv(text: string): string[] {
  return text.split(",").map((s) => s.trim()).filter(Boolean);
}

export function Step5Skills({ skills, hobbies, onSkillsChange, onHobbiesChange }: Step5Props) {
  const [skillsText, setSkillsText] = useState(skills.join(", "));
  const [hobbiesText, setHobbiesText] = useState(hobbies.join(", "));

  // Se resynchronise si l'état global change ailleurs (ex: réinitialisation du CV).
  useEffect(() => setSkillsText(skills.join(", ")), [skills]);
  useEffect(() => setHobbiesText(hobbies.join(", ")), [hobbies]);

  function addSkillSuggestion(text: string) {
    const next = skillsText.trim() ? `${skillsText.trim()}, ${text}` : text;
    setSkillsText(next);
    onSkillsChange(parseCsv(next));
  }

  function addHobbySuggestion(text: string) {
    const next = hobbiesText.trim() ? `${hobbiesText.trim()}, ${text}` : text;
    setHobbiesText(next);
    onHobbiesChange(parseCsv(next));
  }

  return (
    <div className="step-pane cv-card">
      <h3 className="h4 fw-bold mb-1 text-dark">Compétences</h3>
      <p className="text-muted small mb-3">Indiquez vos compétences techniques et humaines (séparées par des virgules).</p>

      <div className="mb-4">
        <label className="form-label small fw-bold">Vos compétences</label>
        <textarea
          className="form-control"
          rows={3}
          placeholder="Ex: Comptabilité générale, Excel, Word, Vente & Négociation, Travail en équipe, Rigueur, Permis B"
          value={skillsText}
          onChange={(e) => {
            setSkillsText(e.target.value);
            onSkillsChange(parseCsv(e.target.value));
          }}
        />
        <small className="text-muted">Astuce : Séparez chaque compétence par une virgule pour qu&apos;elle s&apos;affiche sous forme de badge élégant.</small>
      </div>

      <div className="p-3 bg-light rounded-3 mb-4">
        <div className="small fw-bold text-dark mb-2">Exemples de compétences recherchées :</div>
        <div className="d-flex flex-wrap gap-2">
          {SUGGESTED_SKILLS.map((s) => (
            <span key={s} className="badge bg-white text-dark border p-2" style={{ cursor: "pointer" }} onClick={() => addSkillSuggestion(s)}>
              + {s}
            </span>
          ))}
        </div>
      </div>

      <hr className="mb-4" />

      <h3 className="h5 fw-bold mb-1 text-dark">Loisirs &amp; Centres d&apos;intérêt</h3>
      <p className="text-muted small mb-3">Un CV avec des centres d&apos;intérêt paraît plus humain aux yeux du recruteur (séparés par des virgules).</p>
      <div className="mb-3">
        <label className="form-label small fw-bold">Vos loisirs</label>
        <textarea
          className="form-control"
          rows={2}
          placeholder="Ex: Football, Lecture, Bénévolat associatif, Musique, Voyages"
          value={hobbiesText}
          onChange={(e) => {
            setHobbiesText(e.target.value);
            onHobbiesChange(parseCsv(e.target.value));
          }}
        />
      </div>
      <div className="p-3 bg-light rounded-3">
        <div className="small fw-bold text-dark mb-2">Exemples de loisirs :</div>
        <div className="d-flex flex-wrap gap-2">
          {SUGGESTED_HOBBIES.map((h) => (
            <span key={h} className="badge bg-white text-dark border p-2" style={{ cursor: "pointer" }} onClick={() => addHobbySuggestion(h)}>
              + {h}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
