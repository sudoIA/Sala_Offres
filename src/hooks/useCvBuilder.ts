// src/hooks/useCvBuilder.ts
// État complet du générateur de CV : personnel, listes dynamiques
// (expériences/formations/projets/langues), compétences/loisirs, modèle
// choisi — avec sauvegarde automatique dans sessionStorage et sauvegarde à
// la demande dans Firestore pour l'utilisateur connecté.

"use client";

import { useCallback, useEffect, useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import {
  DEFAULT_CV_STATE,
  type CvEducation,
  type CvExperience,
  type CvLanguage,
  type CvPersonalInfo,
  type CvProject,
  type CvState,
  type CvTemplate,
} from "@/types/cv";

const STORAGE_KEY = "sala_current_cv";

function loadFromSession(): CvState | null {
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (!saved) return null;
    return { ...DEFAULT_CV_STATE, ...JSON.parse(saved) };
  } catch {
    return null;
  }
}

export function useCvBuilder() {
  const [cv, setCv] = useState<CvState>(DEFAULT_CV_STATE);
  const [hydrated, setHydrated] = useState(false);

  // Chargement depuis sessionStorage une fois montée côté client (évite tout
  // mismatch d'hydratation SSR/CSR).
  useEffect(() => {
    const saved = loadFromSession();
    if (saved) setCv(saved);
    setHydrated(true);
  }, []);

  // Sauvegarde automatique à chaque changement (après hydratation initiale).
  useEffect(() => {
    if (!hydrated) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(cv));
    } catch {
      // Stockage indisponible (navigation privée) : tant pis, la session en mémoire suffit.
    }
  }, [cv, hydrated]);

  const updatePersonal = useCallback((patch: Partial<CvPersonalInfo>) => {
    setCv((c) => ({ ...c, personal: { ...c.personal, ...patch } }));
  }, []);

  const setTemplate = useCallback((template: CvTemplate) => {
    setCv((c) => ({ ...c, template }));
  }, []);

  const setSkills = useCallback((skills: string[]) => {
    setCv((c) => ({ ...c, skills }));
  }, []);

  const setHobbies = useCallback((hobbies: string[]) => {
    setCv((c) => ({ ...c, hobbies }));
  }, []);

  // Expériences
  const addExperience = useCallback(() => {
    setCv((c) => ({
      ...c,
      experiences: [...c.experiences, { title: "", company: "", city: "Brazzaville", period: "", description: "" }],
    }));
  }, []);
  const updateExperience = useCallback((index: number, patch: Partial<CvExperience>) => {
    setCv((c) => ({ ...c, experiences: c.experiences.map((e, i) => (i === index ? { ...e, ...patch } : e)) }));
  }, []);
  const removeExperience = useCallback((index: number) => {
    setCv((c) => ({ ...c, experiences: c.experiences.filter((_, i) => i !== index) }));
  }, []);

  // Formations
  const addEducation = useCallback(() => {
    setCv((c) => ({ ...c, education: [...c.education, { degree: "", school: "", city: "Brazzaville", year: "" }] }));
  }, []);
  const updateEducation = useCallback((index: number, patch: Partial<CvEducation>) => {
    setCv((c) => ({ ...c, education: c.education.map((e, i) => (i === index ? { ...e, ...patch } : e)) }));
  }, []);
  const removeEducation = useCallback((index: number) => {
    setCv((c) => ({ ...c, education: c.education.filter((_, i) => i !== index) }));
  }, []);

  // Projets
  const addProject = useCallback(() => {
    setCv((c) => ({ ...c, projects: [...c.projects, { name: "", role: "", description: "" }] }));
  }, []);
  const updateProject = useCallback((index: number, patch: Partial<CvProject>) => {
    setCv((c) => ({ ...c, projects: c.projects.map((p, i) => (i === index ? { ...p, ...patch } : p)) }));
  }, []);
  const removeProject = useCallback((index: number) => {
    setCv((c) => ({ ...c, projects: c.projects.filter((_, i) => i !== index) }));
  }, []);

  // Langues
  const addLanguage = useCallback(() => {
    setCv((c) => ({ ...c, languages: [...c.languages, { name: "", level: "Intermédiaire" }] }));
  }, []);
  const updateLanguage = useCallback((index: number, patch: Partial<CvLanguage>) => {
    setCv((c) => ({ ...c, languages: c.languages.map((l, i) => (i === index ? { ...l, ...patch } : l)) }));
  }, []);
  const removeLanguage = useCallback((index: number) => {
    setCv((c) => ({ ...c, languages: c.languages.filter((_, i) => i !== index) }));
  }, []);

  const resetCv = useCallback(() => {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    setCv(DEFAULT_CV_STATE);
  }, []);

  const saveCvToFirestore = useCallback(async (): Promise<string> => {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("Vous devez être connecté pour sauvegarder votre CV en ligne.");
    }
    const docRef = await addDoc(collection(db, "users", user.uid, "cvs"), {
      ...cv,
      userId: user.uid,
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  }, [cv]);

  return {
    cv,
    setCv,
    updatePersonal,
    setTemplate,
    setSkills,
    setHobbies,
    addExperience,
    updateExperience,
    removeExperience,
    addEducation,
    updateEducation,
    removeEducation,
    addProject,
    updateProject,
    removeProject,
    addLanguage,
    updateLanguage,
    removeLanguage,
    resetCv,
    saveCvToFirestore,
  };
}

export type UseCvBuilderReturn = ReturnType<typeof useCvBuilder>;
