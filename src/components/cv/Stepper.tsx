// src/components/cv/Stepper.tsx
// En-tête de navigation par étapes du générateur de CV.

const STEP_LABELS = ["Infos", "Expériences", "Formations", "Projets", "Compétences", "Langues", "Aperçu & PDF"];

export function Stepper({ currentStep, onGoToStep }: { currentStep: number; onGoToStep: (step: number) => void }) {
  return (
    <div className="cv-stepper-container">
      <div className="stepper-track">
        {STEP_LABELS.map((label, i) => {
          const step = i + 1;
          return (
            <div
              key={step}
              className={`step-node${step === currentStep ? " active" : ""}${step < currentStep ? " completed" : ""}`}
              onClick={() => onGoToStep(step)}
            >
              <div className="step-circle">{step}</div>
              <div className="step-label">{label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
