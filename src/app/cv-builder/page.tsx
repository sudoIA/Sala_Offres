// src/app/cv-builder/page.tsx
// Générateur de CV en 7 étapes : infos personnelles, expériences, formations,
// projets, compétences/loisirs, langues, puis choix du modèle + export PDF.

"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useCvBuilder } from "@/hooks/useCvBuilder";
import { exportCvToPdf } from "@/lib/cv-pdf";
import { Stepper } from "@/components/cv/Stepper";
import { Step1Personal } from "@/components/cv/steps/Step1Personal";
import { Step2Experiences } from "@/components/cv/steps/Step2Experiences";
import { Step3Education } from "@/components/cv/steps/Step3Education";
import { Step4Projects } from "@/components/cv/steps/Step4Projects";
import { Step5Skills } from "@/components/cv/steps/Step5Skills";
import { Step6Languages } from "@/components/cv/steps/Step6Languages";
import { Step7Preview } from "@/components/cv/steps/Step7Preview";

const TOTAL_STEPS = 7;
const REQUIRED_STEP1_FIELDS = ["fullName", "jobTitle", "email", "phone"];

export default function CvBuilderPage() {
  const router = useRouter();
  const cvBuilder = useCvBuilder();
  const { cv } = cvBuilder;
  const [currentStep, setCurrentStep] = useState(1);
  const [invalidFields, setInvalidFields] = useState<Set<string>>(new Set());
  const renderRef = useRef<HTMLDivElement>(null);

  function validateStep1(): boolean {
    const invalid = new Set<string>();
    REQUIRED_STEP1_FIELDS.forEach((field) => {
      const value = cv.personal[field as keyof typeof cv.personal];
      if (!value || String(value).trim().length === 0) invalid.add(field);
    });
    setInvalidFields(invalid);
    return invalid.size === 0;
  }

  function clearInvalid(field: string) {
    setInvalidFields((prev) => {
      if (!prev.has(field)) return prev;
      const next = new Set(prev);
      next.delete(field);
      return next;
    });
  }

  function goToStep(step: number) {
    if (step < 1 || step > TOTAL_STEPS) return;
    if (currentStep === 1 && step > currentStep && !validateStep1()) {
      document.getElementById(REQUIRED_STEP1_FIELDS.find((f) => invalidFields.has(f)) || "fullName")?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      return;
    }
    setCurrentStep(step);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleReset() {
    const hasData = cv.personal.fullName || cv.personal.email || cv.experiences.length > 0 || cv.education.length > 0;
    if (hasData && !confirm("Repartir d'un CV vierge ? Toutes les données actuellement saisies seront définitivement effacées.")) {
      return;
    }
    cvBuilder.resetCv();
    setInvalidFields(new Set());
    setCurrentStep(1);
  }

  async function handleDownloadPdf() {
    const element = renderRef.current;
    if (!element) return;
    const candidateName = (cv.personal.fullName || "Candidat").replace(/\s+/g, "_");
    const filename = `CV_${candidateName}_Sala.pdf`;

    element.classList.add("exporting");
    try {
      await exportCvToPdf(element, filename);
    } catch (err) {
      console.error("Erreur génération PDF :", err);
      alert("Erreur lors de la génération du PDF. Veuillez réessayer.");
    } finally {
      element.classList.remove("exporting");
    }
  }

  async function handleSaveOnline() {
    try {
      await cvBuilder.saveCvToFirestore();
      alert("CV sauvegardé avec succès dans votre compte Sala !");
    } catch (err) {
      const message = (err as Error).message;
      if (message.includes("connecté")) {
        alert(message);
        router.push("/auth");
        return;
      }
      alert("Erreur : " + message);
    }
  }

  return (
    <div style={{ backgroundColor: "#f8faf9", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header className="sala-topbar">
        <Link href="/" className="d-flex align-items-center text-decoration-none">
          <Image src="/img/logo_transparent.png" alt="Logo Sala" width={100} height={38} style={{ height: 38, width: "auto" }} className="me-2" />
          <span style={{ fontWeight: 800, fontSize: "1.25rem", color: "var(--sala-green)" }}>SALA</span>
        </Link>
        <div className="d-flex align-items-center gap-2">
          <span className="badge bg-white text-success fw-bold border px-3 py-1 d-none d-sm-inline">
            <i className="fas fa-magic me-1"></i> Générateur de CV
          </span>
          <button type="button" className="btn btn-outline-danger btn-sm rounded-pill px-3" title="Effacer tout et repartir de zéro" onClick={handleReset}>
            <i className="fas fa-eraser me-1"></i> <span className="d-none d-sm-inline">Nouveau CV</span>
          </button>
          <Link href="/offres" className="btn btn-outline-secondary btn-sm rounded-pill px-3">
            Quitter
          </Link>
        </div>
      </header>

      <Stepper currentStep={currentStep} onGoToStep={goToStep} />

      <main className="container my-4" style={{ maxWidth: 880 }}>
        {currentStep === 1 && (
          <Step1Personal
            personal={cv.personal}
            invalidFields={invalidFields}
            onChange={cvBuilder.updatePersonal}
            onFieldTouched={clearInvalid}
          />
        )}
        {currentStep === 2 && (
          <Step2Experiences
            experiences={cv.experiences}
            onAdd={cvBuilder.addExperience}
            onUpdate={cvBuilder.updateExperience}
            onRemove={cvBuilder.removeExperience}
          />
        )}
        {currentStep === 3 && (
          <Step3Education
            education={cv.education}
            onAdd={cvBuilder.addEducation}
            onUpdate={cvBuilder.updateEducation}
            onRemove={cvBuilder.removeEducation}
          />
        )}
        {currentStep === 4 && (
          <Step4Projects
            projects={cv.projects}
            onAdd={cvBuilder.addProject}
            onUpdate={cvBuilder.updateProject}
            onRemove={cvBuilder.removeProject}
          />
        )}
        {currentStep === 5 && (
          <Step5Skills
            skills={cv.skills}
            hobbies={cv.hobbies}
            onSkillsChange={cvBuilder.setSkills}
            onHobbiesChange={cvBuilder.setHobbies}
          />
        )}
        {currentStep === 6 && (
          <Step6Languages
            languages={cv.languages}
            onAdd={cvBuilder.addLanguage}
            onUpdate={cvBuilder.updateLanguage}
            onRemove={cvBuilder.removeLanguage}
          />
        )}
        {currentStep === 7 && (
          <Step7Preview
            cv={cv}
            onTemplateChange={cvBuilder.setTemplate}
            renderRef={renderRef}
            onDownloadPdf={handleDownloadPdf}
            onSaveOnline={handleSaveOnline}
          />
        )}

        <div className="d-flex justify-content-between align-items-center mt-4">
          {currentStep > 1 ? (
            <button type="button" className="btn btn-light rounded-pill px-4 fw-bold" onClick={() => goToStep(currentStep - 1)}>
              <i className="fas fa-arrow-left me-2"></i> Précédent
            </button>
          ) : (
            <span></span>
          )}
          <div className="ms-auto">
            {currentStep < TOTAL_STEPS && (
              <button type="button" className="btn-sala-primary rounded-pill px-4 fw-bold" onClick={() => goToStep(currentStep + 1)}>
                <span>Suivant</span> <i className="fas fa-arrow-right ms-2"></i>
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
